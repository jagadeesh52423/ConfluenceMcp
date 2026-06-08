// Verification for confluence_get_comments commentType support.
// Part A: mocked logic (routing + shaping, no network).
// Part B: live smoke test against real page 4167205010.
import assert from 'node:assert';
import { ConfluenceService } from './dist/services/confluence.js';

let failures = 0;
const ok = (name) => console.log(`  PASS  ${name}`);
const bad = (name, e) => { failures++; console.error(`  FAIL  ${name}: ${e?.message ?? e}`); };

// ---------- Part A: mocked logic ----------
console.log('\n[A] Mocked logic tests');

// Canned v2 responses keyed by sub-resource path.
const adf = (text) => ({ atlas_doc_format: { representation: 'atlas_doc_format', value: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }], version: 1 }) } });
const fakeResponses = {
  'footer-comments': { results: [
    { id: 1, body: adf('a footer reply'), version: { number: 2, authorId: 'acc-foot', createdAt: '2026-01-01T00:00:00Z' }, _links: { webui: '/x?focusedCommentId=1' } },
  ] },
  'inline-comments': { results: [
    { id: 2, body: adf('inline reply'), resolutionStatus: 'open', version: { number: 1, authorId: 'acc-inline', createdAt: '2026-02-02T00:00:00Z' },
      properties: { inlineOriginalSelection: 'reward_referral_codes', inlineMarkerRef: 'marker-uuid', 'inline-original-selection': 'reward_referral_codes', 'inline-marker-ref': 'marker-uuid' },
      _links: { webui: '/x?focusedCommentId=2' } },
  ] },
};
function makeService() {
  const svc = new ConfluenceService();
  svc.client = { // eslint-disable-line
    get: async (url) => {
      const key = Object.keys(fakeResponses).find((k) => url.endsWith('/' + k));
      return fakeResponses[key] ?? { results: [] };
    },
  };
  return svc;
}

try {
  const footer = await makeService().getComments('123', 'footer');
  assert.strictEqual(footer.length, 1);
  assert.strictEqual(footer[0].type, 'footer');
  assert.strictEqual(footer[0].resolutionStatus, undefined);
  assert.strictEqual(footer[0].anchoredText, undefined);
  assert.strictEqual(footer[0].version, 2);
  ok('commentType=footer returns only footer, tagged type=footer');
} catch (e) { bad('footer-only', e); }

try {
  const inline = await makeService().getComments('123', 'inline');
  assert.strictEqual(inline.length, 1);
  assert.strictEqual(inline[0].type, 'inline');
  assert.strictEqual(inline[0].resolutionStatus, 'open');
  assert.strictEqual(inline[0].anchoredText, 'reward_referral_codes');
  assert.strictEqual(inline[0].markerRef, 'marker-uuid');
  ok('commentType=inline extracts anchoredText + resolutionStatus + markerRef');
} catch (e) { bad('inline-only', e); }

try {
  const all = await makeService().getComments('123'); // default 'all'
  assert.strictEqual(all.length, 2);
  const types = all.map((c) => c.type).sort();
  assert.deepStrictEqual(types, ['footer', 'inline']);
  ok('default (all) returns both footer and inline');
} catch (e) { bad('all-default', e); }

try {
  // kebab-case-only fallback for anchored selection
  const svc = new ConfluenceService();
  svc.client = { get: async () => ({ results: [{ id: 9, body: adf('x'), resolutionStatus: 'resolved', version: { number: 1, authorId: 'a', createdAt: 't' }, properties: { 'inline-original-selection': 'kebabSel', 'inline-marker-ref': 'kebabRef' } }] }) };
  const r = await svc.getComments('1', 'inline');
  assert.strictEqual(r[0].anchoredText, 'kebabSel');
  assert.strictEqual(r[0].markerRef, 'kebabRef');
  assert.strictEqual(r[0].resolutionStatus, 'resolved');
  ok('kebab-case property fallback works');
} catch (e) { bad('kebab-fallback', e); }

// ---------- Part B: live smoke test ----------
console.log('\n[B] Live smoke test (page 4167205010)');
const PAGE = '4167205010';
try {
  const svc = new ConfluenceService();
  const inline = await svc.getComments(PAGE, 'inline');
  const withAnchor = inline.filter((c) => c.anchoredText);
  console.log(`  inline returned: ${inline.length}, with anchoredText: ${withAnchor.length}`);
  assert.ok(inline.length >= 1, 'expected >=1 inline comment');
  assert.ok(inline.every((c) => c.type === 'inline'), 'all tagged inline');
  assert.ok(withAnchor.length >= 1, 'expected >=1 inline comment with anchoredText');
  ok(`LIVE inline: ${inline.length} comment(s), ${withAnchor.length} with anchored text`);

  const all = await svc.getComments(PAGE, 'all');
  console.log(`  all returned: ${all.length} (footer + inline)`);
  assert.ok(all.length >= inline.length, 'all >= inline');
  ok('LIVE all: returns combined set');

  // Emit proof JSON (comment text is fine to show; no token involved).
  console.log('\n--- PROOF (inline comments JSON) ---');
  console.log(JSON.stringify(inline, null, 2));
} catch (e) { bad('live-smoke', e); }

console.log(`\n${failures === 0 ? 'ALL TESTS PASSED' : failures + ' TEST(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
