/**
 * Markdown → ADF (Atlassian Document Format) facade.
 *
 * Backed by the official Atlassian transformer chain:
 *   markdown → ProseMirror doc (MarkdownTransformer)
 *           → ADF JSON         (JSONTransformer)
 *
 * `@atlaskit/adf-schema` is published as CommonJS and its `defaultSchema`
 * subpath cannot be resolved by Node's strict ESM loader. We use
 * `createRequire` to load it through CJS resolution while keeping the rest
 * of the project on native ESM.
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { JSONTransformer } from '@atlaskit/editor-json-transformer';
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer';
import { assertMarkdown } from './wiki-guard.js';

const require = createRequire(import.meta.url);
const { defaultSchema } = require('@atlaskit/adf-schema/schema-default');

const json = new JSONTransformer();
const md = new MarkdownTransformer(defaultSchema);

const CHECKBOX = /^\[([ xX])\]\s+/;

/**
 * Rewrite a `bulletList` of `[ ] `/`[x] ` items as an ADF `taskList`.
 * The transformer has no task-list rule, so GFM checkboxes arrive as literal
 * text in an ordinary bullet. Returns null when the list isn't a task list.
 *
 * All-or-nothing per list: `taskList` accepts only `taskItem`/`taskList`
 * children, so one plain item (or a stray second paragraph) means the list
 * stays as-is rather than producing invalid ADF.
 */
function toTaskList(list: any): any | null {
  const items: any[] = [];
  for (const li of list.content ?? []) {
    const [para, ...rest] = li.content ?? [];
    const lead = para?.content?.[0];
    if (para?.type !== 'paragraph' || lead?.type !== 'text') return null;
    const m = CHECKBOX.exec(lead.text);
    if (!m) return null;
    const nested = rest.map((n: any) => (n?.type === 'bulletList' ? toTaskList(n) : null));
    if (nested.some((n: any) => n === null)) return null;
    const head = { ...lead, text: lead.text.slice(m[0].length) };
    items.push(
      {
        type: 'taskItem',
        attrs: { localId: randomUUID(), state: m[1] === ' ' ? 'TODO' : 'DONE' },
        content: [...(head.text ? [head] : []), ...para.content.slice(1)],
      },
      ...nested // ADF nests a taskList as a sibling of its taskItem, not a child
    );
  }
  return items.length ? { type: 'taskList', attrs: { localId: randomUUID() }, content: items } : null;
}

/**
 * ponytail: converts checkbox bullets only. A list is not descended into when
 * it fails conversion, so `- plain` with a `- [ ] sub` child keeps the literal
 * `[ ]` — nesting a taskList under a plain listItem isn't worth the risk.
 * Ordered `1. [ ] x` is likewise left alone.
 */
function convertTaskLists(node: any): any {
  if (!node || !Array.isArray(node.content)) return node;
  if (node.type === 'bulletList') return toTaskList(node) ?? node;
  if (node.type === 'orderedList') return node;
  return { ...node, content: node.content.map(convertTaskLists) };
}

/**
 * Convert a markdown string to an ADF JSON document.
 * Returns a valid empty doc when the input is null/undefined/empty.
 */
export function markdownToADF(input: string): any {
  assertMarkdown(input);
  return convertTaskLists(json.encode(md.parse(input ?? '')));
}

// ponytail: self-check, run with `npx tsx src/formatters/markdown-to-adf.ts`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { equal, deepEqual } = await import('node:assert');
  // localId is a uuid per call; drop it so shapes compare.
  const shape = (n: any): string =>
    n.type === 'text'
      ? JSON.stringify(n.text) + (n.marks ?? []).map((m: any) => `:${m.type}`).join('')
      : `${n.type}${n.attrs?.state ? `:${n.attrs.state}` : ''}(${(n.content ?? []).map(shape).join(',')})`;
  const s = (src: string) => markdownToADF(src).content.map(shape).join(' ');

  equal(s('- [ ] todo\n- [x] done'), 'taskList(taskItem:TODO("todo"),taskItem:DONE("done"))');
  equal(s('- [X] upper'), 'taskList(taskItem:DONE("upper"))');
  // prefix is its own unmarked text node here: exercises the empty-head path
  equal(s('- [ ] **bold**'), 'taskList(taskItem:TODO("bold":strong))');
  equal(s('- [ ] top\n  - [x] sub'), 'taskList(taskItem:TODO("top"),taskList(taskItem:DONE("sub")))');
  // not task lists — must survive untouched
  equal(s('- one\n- two'), 'bulletList(listItem(paragraph("one")),listItem(paragraph("two")))');
  equal(s('- [ ] mixed\n- plain'), 'bulletList(listItem(paragraph("[ ] mixed")),listItem(paragraph("plain")))');
  equal(s('1. [ ] ordered'), 'orderedList(listItem(paragraph("[ ] ordered")))');
  equal(s('> - [ ] quoted'), 'blockquote(taskList(taskItem:TODO("quoted")))');
  equal(s('`- [ ] in code`'), 'paragraph("- [ ] in code":code)');
  // localIds must be unique within a doc
  const ids = JSON.stringify(markdownToADF('- [ ] a\n- [x] b')).match(/"localId":"[^"]+"/g) ?? [];
  equal(ids.length, 3);
  deepEqual(new Set(ids).size, 3);
  deepEqual(markdownToADF('').content ?? [], []);
  console.log('markdown-to-adf: ok');
}
