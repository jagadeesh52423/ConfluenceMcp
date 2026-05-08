# ADF Formatter Replacement & Confluence API v2 Migration

**Date:** 2026-05-08
**Status:** Approved (pending user review)

## Problem

`src/formatters/adf-formatter.ts` is a 1254-line custom parser containing three parallel converters (`parseDescriptionToADF`, `parseDescriptionToWikiMarkup`, `markdownToConfluenceStorage`) and an inline-formatting parser, each implementing the same block-level dispatch (headers, lists, code, panels, tables, rules…) for a different output format.

Two consequences:

1. **Correctness bugs.** Users hit parsing edge cases the hand-written parser doesn't cover.
2. **Extension cost.** Adding a construct or output format means editing 1–3 megafunctions; adding tests is impractical because the parser has no AST seam.

## Goals

- Replace the hand-written parser with **official Atlassian transformers** so Atlassian's own engine handles edge cases.
- Migrate Confluence calls from REST API v1 (storage format) to **REST API v2 (ADF)** so the storage-format converter is no longer needed.
- Drop wiki-markup support entirely (input *and* output) — it's legacy and not used by current callers.
- Keep `formatters/index.ts` as the single seam between services and the parser, so swapping the underlying library later is a one-file change. The exported names *do* change (one new function `markdownToADF` replaces three old ones), but the seam itself stays.

## Non-goals

- Adding new markdown features beyond what the official transformer supports.
- Refactoring tools, handlers, registry, or snapshot layers — those stay.
- Maintaining storage-format output. After migration, ADF is the only output format.
- Maintaining wire-format compatibility with current parser output. Different (correct) output is expected and desired since the current parser has bugs.

## Design

### Target file layout

```
src/formatters/
  index.ts              // public exports — API surface unchanged
  markdown-to-adf.ts    // facade over @atlaskit/editor-markdown-transformer
  adf-to-text.ts        // small recursive walker (~30 lines)
```

### Public API (unchanged signatures)

| Export | Purpose | Backed by |
|---|---|---|
| `markdownToADF(md: string): ADFDocument` | Markdown → ADF JSON | atlaskit |
| `extractTextFromADF(adf: any): string` | ADF → plain text (display) | custom walker |

`parseDescriptionToADF`, `parseDescriptionToWikiMarkup`, `markdownToConfluenceStorage`, `formatWikiMarkup`, `convertWikiTablesToMarkdown`, `parseInlineFormatting`, `applyColWidths`, `buildColGroupHtml`, `escapeStorageHtml`, `applyInlineStorageFormat`, `isAlreadyStorageFormat`, `isWikiMarkup`, `LANGUAGE_ALIASES`, table-width constants — **all deleted**.

### Implementation skeleton — `markdown-to-adf.ts`

```ts
import { defaultSchema } from '@atlaskit/adf-schema';
import { JSONTransformer } from '@atlaskit/editor-json-transformer';
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer';

const json = new JSONTransformer();
const md = new MarkdownTransformer(defaultSchema);

export function markdownToADF(input: string): any {
  return json.encode(md.parse(input ?? ''));
}
```

### Implementation skeleton — `adf-to-text.ts`

A small recursive walker. Atlaskit doesn't ship an "ADF → text" function suitable for our display use case, and we only need a few node types. The walker is the simplest thing that works:

```ts
export function extractTextFromADF(node: any): string {
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractTextFromADF).filter(Boolean).join('\n');
  if (typeof node !== 'object') return String(node);
  switch (node.type) {
    case 'text':      return node.text ?? '';
    case 'hardBreak': return '\n';
    default:          return extractTextFromADF(node.content);
  }
}
```

### Dependency choice

**Primary:** `@atlaskit/editor-markdown-transformer` + `@atlaskit/editor-json-transformer` + `@atlaskit/adf-schema` + `prosemirror-model` (peer).

`@atlaskit/adf-schema` exports `defaultSchema` (full ADF) and product-specific schemas. Both Jira Cloud and Confluence Cloud accept ADF produced from `defaultSchema`. If a node-validation issue surfaces against Confluence, switch the Confluence-side transformer instance to `confluenceSchema` from the same package — implementation can decide at the call site.

**Fallback (decided in advance):** if atlaskit doesn't run cleanly in this project's Node ESM/TS setup after a one-day spike, swap to `marklassian` behind the same `markdown-to-adf.ts` facade. Public API is identical; only the import line changes.

### Confluence v1 → v2 migration

Page bodies submitted as ADF (`representation: "atlas_doc_format"`); responses requested with `body-format=atlas_doc_format`.

| Operation | New endpoint |
|---|---|
| Get / create / update / delete page | `/wiki/api/v2/pages[/:id]` |
| List spaces | `/wiki/api/v2/spaces` |
| Pages by space | `/wiki/api/v2/spaces/:id/pages` |
| Page children | `/wiki/api/v2/pages/:id/children` |
| Versions | `/wiki/api/v2/pages/:id/versions` |
| Labels | `/wiki/api/v2/pages/:id/labels` |
| Attachments (list) | `/wiki/api/v2/pages/:id/attachments` |
| Attachment ops | `/wiki/api/v2/attachments/:id` |
| Footer comments | `/wiki/api/v2/footer-comments` |
| Search (CQL) | **stays v1** — `/wiki/rest/api/search` (no v2 equivalent) |

Two breaking shape changes inside the codebase:

1. **Space identifiers.** v2 endpoints accept space `id` (numeric), not `key`. The `confluence_get_pages_by_space` tool currently takes `spaceKey` as input. We resolve key → id via `GET /wiki/api/v2/spaces?keys=<KEY>` once per call. The MCP tool's input schema stays the same (still accepts `spaceKey`); the resolution happens inside the service.
2. **Page body type.** `ConfluencePage.content` changes from `string` (storage HTML) to `any` (ADF JSON). This is a breaking change for any downstream MCP consumer reading the field. Tool descriptions and the `ConfluencePage` interface in `src/types.ts` are updated to reflect this.

### Caller updates

| File | Change |
|---|---|
| `src/services/jira/base.ts` | `toADF` now calls `markdownToADF`. `toWiki` and the `parseDescriptionToWikiMarkup` import are deleted; any caller of `toWiki` switches to `toADF`. |
| `src/services/confluence.ts` | All `markdownToConfluenceStorage(content)` call sites switch to `markdownToADF(content)`; request bodies change from `body.storage` to `body.atlas_doc_format` with `representation: "atlas_doc_format"`. Endpoint paths swap to v2 per the table above. Response parsing reads `body.atlas_doc_format.value` (already ADF JSON, no further conversion). |
| `src/types.ts` | `ConfluencePage.content: string` → `content: any` (ADF JSON). |
| `src/tools/confluence-tools.ts` | Tool descriptions for any tool returning `content` updated to say "ADF JSON document" instead of "storage HTML". |

## Phasing

Each phase is a separately mergeable PR.

### Phase 1 — Spike (≤ 1 day, throwaway branch)
Install atlaskit transformers, write a 20-line script that parses a representative markdown sample in this project's Node ESM/TS setup, and run it. **Exit criteria:** valid ADF JSON out, no module-resolution errors. If it fails, switch to marklassian for the rest of the work without re-confirming.

### Phase 2 — Replace markdown → ADF
- Add the new dependency.
- Create `formatters/markdown-to-adf.ts` and `formatters/adf-to-text.ts`.
- Switch `services/jira/base.ts` and `services/confluence.ts` callers to `markdownToADF`.
- For Confluence, use `representation: "atlas_doc_format"` on existing **v1** endpoints as a stepping stone — Cloud v1 accepts ADF, so this isolates the formatter swap from the endpoint migration.
- Delete the entire `adf-formatter.ts` file and update `formatters/index.ts` to re-export only `markdownToADF` and `extractTextFromADF`.
- Delete `parseDescriptionToWikiMarkup`, `formatWikiMarkup`, `toWiki`, and any caller references.

**Exit criteria:** create issue + create page operations work end-to-end against a real Jira/Confluence; all existing MCP tools build and load.

### Phase 3 — Migrate Confluence to v2
Endpoint-by-endpoint inside `services/confluence.ts`. Each tool tested manually against a real Confluence instance. CQL search stays on v1.

**Exit criteria:** every Confluence MCP tool exercised once against a real instance; `ConfluencePage.content` returned as ADF JSON; tool descriptions reflect the new shape.

### Phase 4 — Cleanup
- Remove unused types from `src/types.ts` (storage-format-related, wiki-mode-related).
- Update README.md to document ADF input/output.
- Bump package version to 1.2.0 (breaking change to `ConfluencePage.content`).

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Atlaskit packages don't load cleanly in Node ESM | Phase 1 spike; predetermined fallback to marklassian |
| Atlaskit pulls a large dep tree (ProseMirror) | Acceptable — this is a server-side process, bundle size irrelevant |
| `ConfluencePage.content` shape change breaks downstream MCP consumers | Documented as breaking change; minor version bump (1.2.0); tool descriptions updated |
| v2 search endpoint missing | Documented; CQL search retained on v1 — only one tool affected (`confluence_search_pages`) |
| Atlaskit markdown parser handles a construct differently than the old parser | Expected and desired — old parser has bugs. No wire-format parity required. |

## Verification

No automated test suite exists in this repo. Verification is manual + sample-driven:

- Maintain a `docs/superpowers/specs/2026-05-08-adf-formatter-samples.md` (created during implementation, not now) with ~10 representative markdown inputs and the resulting ADF JSON for record.
- Each phase's exit criteria includes manually exercising the affected tools against a real Atlassian instance.
- A regression in any markdown construct after Phase 2 is treated as a separate bug, not a blocker for Phase 3.

## Out of scope

- Adding automated tests for the formatter (could be a follow-up).
- Refactoring tool registry / handlers / snapshot layers.
- ServiceNow / Notion / GitHub support or any other product extensibility.
- Smart Field Handling refactor (Jira transitions).
