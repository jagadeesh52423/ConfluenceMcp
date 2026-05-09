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
import { JSONTransformer } from '@atlaskit/editor-json-transformer';
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer';

const require = createRequire(import.meta.url);
const { defaultSchema } = require('@atlaskit/adf-schema/schema-default');

const json = new JSONTransformer();
const md = new MarkdownTransformer(defaultSchema);

/**
 * Convert a markdown string to an ADF JSON document.
 * Returns a valid empty doc when the input is null/undefined/empty.
 */
export function markdownToADF(input: string): any {
  return json.encode(md.parse(input ?? ''));
}
