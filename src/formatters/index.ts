/**
 * Public formatter API. This file is the single seam between services and
 * the underlying markdown/ADF library; swapping the implementation is a
 * one-file change.
 */
export { markdownToADF } from './markdown-to-adf.js';
export { extractTextFromADF } from './adf-to-text.js';
