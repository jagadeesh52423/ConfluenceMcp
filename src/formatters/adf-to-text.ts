/**
 * ADF → plain text walker.
 *
 * Atlaskit doesn't ship an ADF→text utility tailored for our display use
 * case; the only nodes we need to surface explicitly are `text` and
 * `hardBreak`. Everything else recurses into `content`.
 */
export function extractTextFromADF(node: any): string {
  if (!node) return '';
  if (Array.isArray(node)) {
    return node.map(extractTextFromADF).filter(Boolean).join('\n');
  }
  if (typeof node !== 'object') return String(node);

  switch (node.type) {
    case 'text':
      return node.text ?? '';
    case 'hardBreak':
      return '\n';
    default:
      return extractTextFromADF(node.content);
  }
}
