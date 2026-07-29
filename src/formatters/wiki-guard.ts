/**
 * Rejects Atlassian wiki markup in fields that are documented as Markdown.
 *
 * Wiki markup is not converted — the markdown→ADF transformer passes it
 * through as literal text, so `h1. Title` silently ships as the string
 * "h1. Title". Failing loudly with the markdown equivalent is the only way
 * callers learn.
 *
 * Only unambiguous wiki constructs are matched. `*bold*`, `_italic_`,
 * `-strike-`, `{{mono}}` and friends are valid markdown and/or common in
 * templated content, so they are deliberately not detected.
 */

import { pathToFileURL } from 'node:url';

const RULES: Array<{ pattern: RegExp; wiki: string; markdown: string }> = [
  { pattern: /^h[1-6]\.\s/m,                       wiki: 'h1. Heading',        markdown: '# Heading' },
  { pattern: /^bq\.\s/m,                           wiki: 'bq. Quote',          markdown: '> Quote' },
  { pattern: /^\s*\|\|/m,                          wiki: '||Header||',         markdown: '| Header |\\n| --- |' },
  { pattern: /\{code(:[^}]*)?\}/,                  wiki: '{code}...{code}',    markdown: '```lang ... ```' },
  { pattern: /\{noformat\}/,                       wiki: '{noformat}',         markdown: '``` ... ```' },
  { pattern: /\{(quote|panel|expand|section|column|color)(:[^}]*)?\}/, wiki: '{panel}/{quote}/{color:...}', markdown: 'plain markdown (blockquote, heading, or text)' },
  { pattern: /\[[^\]|\n]*\|[^\]\n]+\]/,            wiki: '[text|url]',         markdown: '[text](url)' },
  // ponytail: `*` runs only, at column 0. `##`/`###` are wiki nested ordered
  // lists AND markdown headings — ambiguous, so markdown wins and `#` is not
  // matched here at all. Leading whitespace excluded: indented `**` is bold.
  { pattern: /^\*{2,}\s/m,                         wiki: '** nested list',     markdown: '  - nested list (2-space indent)' },
];

/** Strip fenced/inline code so documented wiki syntax in examples doesn't trip the guard. */
function stripCode(input: string): string {
  return input.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

/**
 * Throws if `input` contains Atlassian wiki markup. No-op otherwise.
 * @param field name of the field being validated, used in the error message.
 */
export function assertMarkdown(input: string | null | undefined, field = 'content'): void {
  if (!input) return;
  const body = stripCode(input);
  const hits = RULES.filter((r) => r.pattern.test(body));
  if (hits.length === 0) return;

  throw new Error(
    `${field} contains Atlassian wiki markup, but this server only accepts Markdown.\n` +
      hits.map((h) => `  ${h.wiki}  ->  ${h.markdown}`).join('\n') +
      `\nRewrite ${field} in Markdown and retry.`
  );
}

// ponytail: self-check, run with `npx tsx src/formatters/wiki-guard.ts`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { throws, doesNotThrow } = await import('node:assert');
  throws(() => assertMarkdown('h2. Overview'), /wiki markup/);
  throws(() => assertMarkdown('see {code:java}x{code}'), /```/);
  throws(() => assertMarkdown('||Name||Age||\n|a|1|'), /Header/);
  throws(() => assertMarkdown('[docs|https://x.com]'), /\[text\]\(url\)/);
  throws(() => assertMarkdown('** nested bullet'), /nested list/);
  doesNotThrow(() => assertMarkdown('# Real markdown\n\n**bold** and [link](https://x.com)'));
  doesNotThrow(() => assertMarkdown('## What\n\n### Verification\n\n#### Tests added\n'));
  doesNotThrow(() => assertMarkdown('- item\n  - **bold** nested item'));
  doesNotThrow(() => assertMarkdown('```\nh1. inside a fence is fine\n```'));
  doesNotThrow(() => assertMarkdown('use `{code}` for blocks'));
  doesNotThrow(() => assertMarkdown(''));
  doesNotThrow(() => assertMarkdown(undefined));
  console.log('wiki-guard: ok');
}
