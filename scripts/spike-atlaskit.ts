/**
 * Phase 1 spike — verifies that @atlaskit/editor-markdown-transformer,
 * @atlaskit/editor-json-transformer, and @atlaskit/adf-schema load and run
 * cleanly under this project's Node ESM/TS setup.
 *
 * Per docs/superpowers/specs/2026-05-08-adf-formatter-replacement-design.md
 * (Phase 1). Throwaway — verify-only, do not import from src/.
 *
 * Run: npx tsx scripts/spike-atlaskit.ts
 *
 * Note on imports: @atlaskit/adf-schema is published as a CJS-only package
 * (no `exports` map, no `type: "module"`) and uses subpath package.json
 * redirects (e.g. `schema-default/package.json` -> `../dist/cjs/...`) that
 * Node's strict-ESM resolver cannot follow. We therefore load
 * `defaultSchema` via `createRequire`, which uses CJS resolution and honors
 * those redirects. The two transformer packages can be imported normally
 * because Node interops their CJS bundles automatically.
 */

import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSONTransformer } from '@atlaskit/editor-json-transformer';
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer';

const require = createRequire(import.meta.url);
const { defaultSchema } = require('@atlaskit/adf-schema/schema-default') as {
  defaultSchema: unknown;
};

const SAMPLE_MARKDOWN = `# Heading 1

A paragraph with **bold**, *italic*, and \`inline code\` plus a [link](https://example.com).

## Heading 2

\`\`\`ts
function greet(name: string): string {
  return \`hello, \${name}\`;
}
\`\`\`

- unordered item 1
- unordered item 2
  - nested unordered child
- unordered item 3

1. ordered item 1
2. ordered item 2
   1. nested ordered child
3. ordered item 3

> A blockquote with **emphasis** inside.

| Column A | Column B | Column C |
|----------|----------|----------|
| a1       | b1       | c1       |
| a2       | b2       | c2       |

---

End of sample.
`;

function runSpike(): void {
  const json = new JSONTransformer();
  // `defaultSchema` is an instance of prosemirror-model's Schema; the
  // transformer's TS types want that exact instance. We pass it through
  // without re-declaring the structural type — `any` is acceptable here
  // because this script is throwaway verify-only code.
  const md = new MarkdownTransformer(defaultSchema as any);

  const pmNode = md.parse(SAMPLE_MARKDOWN);
  const adf = json.encode(pmNode);

  // Sanity checks — fail loudly if shape is wrong.
  if (!adf || typeof adf !== 'object') {
    throw new Error('Spike FAILED: encoder returned non-object');
  }
  const root = adf as { type?: string; content?: unknown[] };
  if (root.type !== 'doc') {
    throw new Error(`Spike FAILED: expected root type "doc", got "${root.type}"`);
  }
  if (!Array.isArray(root.content) || root.content.length === 0) {
    throw new Error('Spike FAILED: doc.content is empty');
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(here, 'spike-atlaskit-output.json');
  writeFileSync(outPath, JSON.stringify(adf, null, 2) + '\n', 'utf8');

  const blockTypes = root.content.map((n: any) => n?.type ?? 'unknown');
  console.log('Spike PASS — atlaskit transformers loaded and produced ADF.');
  console.log(`Top-level block count: ${root.content.length}`);
  console.log(`Top-level block types: ${blockTypes.join(', ')}`);
  console.log(`Sample written to: ${outPath}`);
}

try {
  runSpike();
} catch (err) {
  console.error('Spike FAILED with error:');
  console.error(err);
  process.exit(1);
}
