/**
 * Preserves Confluence inline comments across a page update.
 *
 * An inline comment is not a separate resource — it is an `annotation` mark
 * (`annotationType: "inlineComment"`, `id` = the comment's marker ref) carried
 * by the text nodes it covers. Markdown cannot express those marks, so writing
 * a body built from markdown deletes every marker and detaches every inline
 * comment on the page.
 *
 * The fix is to read the marks off the live body first and re-anchor them onto
 * the new document by matching the annotated text.
 */

import { pathToFileURL } from 'node:url';

export interface Annotation {
  id: string;
  annotationType: string;
  /** The text the comment was anchored to, concatenated in document order. */
  text: string;
}

const isAnnotation = (m: any) => m?.type === 'annotation' && m?.attrs?.id;

/**
 * Only this id blocks re-marking — Confluence allows several comments on the
 * same phrase, so an unrelated annotation must not hide the text from another.
 */
const hasAnnotationId = (n: any, id: string) =>
  (n?.marks ?? []).some((m: any) => isAnnotation(m) && m.attrs.id === id);

/**
 * Occurrences of `ann.text` that could take the mark. Counts per occurrence,
 * not per node: one text node saying "set attributes before reading attributes"
 * offers two candidates, and picking either silently relocates the comment.
 */
function countCandidates(node: any, ann: Annotation): number {
  if (node?.type === 'text') {
    if (typeof node.text !== 'string' || hasAnnotationId(node, ann.id)) return 0;
    return node.text.split(ann.text).length - 1;
  }
  return (node?.content ?? []).reduce((sum: number, c: any) => sum + countCandidates(c, ann), 0);
}

/**
 * Collect every inline-comment annotation in `doc`, in document order.
 * Text spanning several nodes (a comment covering bold text, say) is
 * concatenated under one id.
 */
export function collectAnnotations(doc: any): Annotation[] {
  const byId = new Map<string, Annotation>();
  const walk = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'text' && typeof node.text === 'string') {
      for (const m of node.marks ?? []) {
        if (!isAnnotation(m)) continue;
        const found = byId.get(m.attrs.id);
        if (found) found.text += node.text;
        else
          byId.set(m.attrs.id, {
            id: m.attrs.id,
            annotationType: m.attrs.annotationType ?? 'inlineComment',
            text: node.text,
          });
      }
    }
    for (const child of node.content ?? []) walk(child);
  };
  walk(doc);
  return [...byId.values()];
}

/** Split `node` at `at` so the annotated slice carries the extra mark. */
function splitText(node: any, at: number, ann: Annotation): any[] {
  const before = node.text.slice(0, at);
  const after = node.text.slice(at + ann.text.length);
  const mark = { type: 'annotation', attrs: { id: ann.id, annotationType: ann.annotationType } };
  return [
    ...(before ? [{ ...node, text: before }] : []),
    { ...node, text: ann.text, marks: [...(node.marks ?? []), mark] },
    ...(after ? [{ ...node, text: after }] : []),
  ];
}

/** Re-anchor one annotation onto the first unannotated text node containing its text. */
function applyOne(node: any, ann: Annotation, state: { applied: boolean }): any {
  if (state.applied || !node || !Array.isArray(node.content)) return node;
  const out: any[] = [];
  for (const child of node.content) {
    if (!state.applied && child?.type === 'text' && typeof child.text === 'string' && !hasAnnotationId(child, ann.id)) {
      const at = child.text.indexOf(ann.text);
      if (at !== -1) {
        state.applied = true;
        out.push(...splitText(child, at, ann));
        continue;
      }
    }
    out.push(state.applied ? child : applyOne(child, ann, state));
  }
  return { ...node, content: out };
}

/**
 * Re-apply `annotations` to `doc`, matching on the annotated text.
 *
 * An anchor whose text occurs more than once is reported in `ambiguous` and
 * left unmarked. Picking an occurrence would move a reviewer's comment onto
 * unrelated text while reporting success; leaving it unmarked reproduces
 * exactly what Confluence does today, so it costs nothing and stays visible.
 *
 * ponytail: exact substring within a single text node. A comment whose text was
 * reworded, or whose span is broken up by other marks (`**bold** inside the
 * selection`), lands in `dropped`. Upgrade path if that bites: match across
 * adjacent text nodes, then fuzzy/longest-common-substring.
 */
export function reapplyAnnotations(
  doc: any,
  annotations: Annotation[]
): { doc: any; preserved: Annotation[]; dropped: Annotation[]; ambiguous: Annotation[] } {
  let out = doc;
  const preserved: Annotation[] = [];
  const dropped: Annotation[] = [];
  const ambiguous: Annotation[] = [];
  for (const ann of annotations) {
    if (!ann.text.trim()) {
      dropped.push(ann);
      continue;
    }
    if (countCandidates(out, ann) > 1) {
      ambiguous.push(ann);
      continue;
    }
    const state = { applied: false };
    const next = applyOne(out, ann, state);
    if (state.applied) {
      out = next;
      preserved.push(ann);
    } else {
      dropped.push(ann);
    }
  }
  return { doc: out, preserved, dropped, ambiguous };
}

const TABLE = 'table';

/**
 * Where an annotation sat in an earlier version of a page, described by
 * surrounding content rather than by index so it survives edits above it.
 */
export type Locator =
  | { kind: 'tableCell'; header: string[]; rowKey: string; cell: number; text: string; annotationType: string }
  | { kind: 'block'; blockType: string; blockText: string; text: string; annotationType: string };

/** Concatenated text of the nodes under `node` carrying `markerRef`. */
function annotatedText(node: any, markerRef: string): string {
  if (node?.type === 'text') {
    return (node.marks ?? []).some((m: any) => isAnnotation(m) && m.attrs.id === markerRef) ? node.text : '';
  }
  return (node?.content ?? []).map((c: any) => annotatedText(c, markerRef)).join('');
}

const flatten = (node: any): string =>
  node?.type === 'text' ? node.text ?? '' : (node?.content ?? []).map(flatten).join('');

function annotationTypeOf(node: any, markerRef: string): string {
  if (node?.type === 'text') {
    const found = (node.marks ?? []).find((m: any) => isAnnotation(m) && m.attrs.id === markerRef);
    return found?.attrs?.annotationType ?? '';
  }
  for (const child of node?.content ?? []) {
    const found = annotationTypeOf(child, markerRef);
    if (found) return found;
  }
  return '';
}

/**
 * Describe where `markerRef` is anchored in `doc`. Returns null if absent.
 *
 * Tables are keyed by header row + the row's first-column value, so a comment
 * on a field-reference row still resolves after rows are added or reordered
 * above it — an index would not survive that.
 */
export function locateAnnotation(doc: any, markerRef: string): Locator | null {
  for (const block of doc?.content ?? []) {
    const text = annotatedText(block, markerRef);
    if (!text) continue;
    const annotationType = annotationTypeOf(block, markerRef) || 'inlineComment';

    if (block.type === TABLE) {
      const header = (block.content?.[0]?.content ?? []).map(flatten);
      for (const row of block.content ?? []) {
        const cells = row.content ?? [];
        const cell = cells.findIndex((c: any) => annotatedText(c, markerRef));
        if (cell === -1) continue;
        return { kind: 'tableCell', header, rowKey: flatten(cells[0]), cell, text, annotationType };
      }
      continue; // marker counted inside the table but no cell owned it — treat as unlocatable
    }
    return { kind: 'block', blockType: block.type, blockText: flatten(block), text, annotationType };
  }
  return null;
}

/** Candidate nodes in `doc` that `locator` could describe. */
function findHosts(doc: any, locator: Locator): any[] {
  const blocks = doc?.content ?? [];
  if (locator.kind === 'block') {
    return blocks.filter((b: any) => b?.type === locator.blockType && flatten(b) === locator.blockText);
  }
  const hosts: any[] = [];
  const wantHeader = JSON.stringify(locator.header);
  for (const block of blocks) {
    if (block?.type !== TABLE) continue;
    if (JSON.stringify((block.content?.[0]?.content ?? []).map(flatten)) !== wantHeader) continue;
    for (const row of block.content ?? []) {
      const cells = row.content ?? [];
      if (flatten(cells[0]) !== locator.rowKey) continue;
      if (cells[locator.cell]) hosts.push(cells[locator.cell]);
    }
  }
  return hosts;
}

/** Rebuild `node` with `target` (matched by identity) swapped for `replacement`. */
function replaceNode(node: any, target: any, replacement: any): any {
  if (node === target) return replacement;
  if (!node || !Array.isArray(node.content)) return node;
  return { ...node, content: node.content.map((c: any) => replaceNode(c, target, replacement)) };
}

/**
 * Re-attach `markerRef` to `doc` at the position `locator` describes.
 *
 * 'ambiguous' means several equally-good hosts matched; the caller must decide,
 * because guessing silently moves a reviewer's comment onto unrelated text.
 * That is not hypothetical — anchor text "unique_id" occurs in ten text nodes
 * of a real page whose true anchor was one specific table cell.
 */
export function applyLocator(
  doc: any,
  locator: Locator,
  markerRef: string
): { doc: any; status: 'exact' | 'ambiguous' | 'lost' | 'unmatchable' } {
  const ann: Annotation = { id: markerRef, annotationType: locator.annotationType, text: locator.text };
  const structural = findHosts(doc, locator);
  const hosts = structural.filter((h) => canMark(h, ann));
  if (hosts.length === 0) {
    // 'unmatchable' only when the text is genuinely still there but split across
    // nodes. A surviving host proves nothing on its own: a renamed table field
    // keeps its row while the anchored words are gone, and that is 'lost'.
    const stillPresent = structural.some((h) => flatten(h).includes(ann.text));
    return { doc, status: stillPresent ? 'unmatchable' : 'lost' };
  }
  if (hosts.length > 1) return { doc, status: 'ambiguous' };
  // Narrowing to one host is not enough: the anchor may repeat inside it, and
  // applyOne would take the first occurrence and report success.
  if (countCandidates(hosts[0], ann) > 1) return { doc, status: 'ambiguous' };
  const state = { applied: false };
  const marked = applyOne(hosts[0], ann, state);
  return state.applied ? { doc: replaceNode(doc, hosts[0], marked), status: 'exact' } : { doc, status: 'unmatchable' };
}

function canMark(host: any, ann: Annotation): boolean {
  const state = { applied: false };
  applyOne(host, ann, state);
  return state.applied;
}

// ponytail: self-check, run with `npx tsx src/formatters/annotations.ts`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { deepEqual, equal } = await import('node:assert');
  const must = (loc: Locator | null): Locator => {
    if (!loc) throw new Error('expected a locator, got null');
    return loc;
  };
  const ann = (id: string) => ({ type: 'annotation', attrs: { id, annotationType: 'inlineComment' } });
  const text = (t: string, marks?: any[]) => ({ type: 'text', text: t, ...(marks ? { marks } : {}) });
  const para = (...content: any[]) => ({ type: 'paragraph', content });
  const doc = (...content: any[]) => ({ type: 'doc', version: 1, content });

  // collect: single node, multi-node span, and none
  deepEqual(collectAnnotations(doc(para(text('hi '), text('there', [ann('c1')])))), [
    { id: 'c1', annotationType: 'inlineComment', text: 'there' },
  ]);
  deepEqual(
    collectAnnotations(doc(para(text('a', [ann('c1')]), text('b', [ann('c1'), { type: 'strong' }])))),
    [{ id: 'c1', annotationType: 'inlineComment', text: 'ab' }]
  );
  deepEqual(collectAnnotations(doc(para(text('plain')))), []);

  // reapply: text survived -> node splits into 3, mark on the middle slice
  const anns = collectAnnotations(doc(para(text('fix '), text('this bug', [ann('c1')]), text(' now'))));
  const fresh = doc(para(text('please fix this bug now, thanks')));
  const r = reapplyAnnotations(fresh, anns);
  equal(r.preserved.length, 1);
  equal(r.dropped.length, 0);
  deepEqual(r.doc.content[0].content, [
    text('please fix '),
    text('this bug', [ann('c1')]),
    text(' now, thanks'),
  ]);
  // original left untouched
  deepEqual(fresh.content[0].content, [text('please fix this bug now, thanks')]);

  // reapply: anchors inside nested structures, and preserves existing marks
  const nested = doc({
    type: 'bulletList',
    content: [{ type: 'listItem', content: [para(text('the bug', [{ type: 'strong' }]))] }],
  });
  const rn = reapplyAnnotations(nested, [{ id: 'c9', annotationType: 'inlineComment', text: 'the bug' }]);
  equal(rn.preserved.length, 1);
  deepEqual(rn.doc.content[0].content[0].content[0].content, [
    text('the bug', [{ type: 'strong' }, ann('c9')]),
  ]);

  // reapply: reworded text is dropped, not force-fitted
  const rd = reapplyAnnotations(doc(para(text('completely rewritten'))), anns);
  equal(rd.preserved.length, 0);
  deepEqual(rd.dropped.map((a) => a.id), ['c1']);

  // an anchor occurring twice is refused, not guessed at — marking either one
  // would move a reviewer's comment onto unrelated text and report success
  const twice = [{ id: 'a', annotationType: 'inlineComment', text: 'dup' }];
  const rtwice = reapplyAnnotations(doc(para(text('dup one')), para(text('dup two'))), twice);
  deepEqual(rtwice.ambiguous.map((a) => a.id), ['a']);
  equal(rtwice.preserved.length, 0);
  deepEqual(rtwice.doc.content[0].content[0].marks, undefined); // nothing marked

  // two comments on the SAME occurrence both attach — Confluence allows it, so
  // an unrelated annotation must not hide the text from the next one
  const same = [
    { id: 'a', annotationType: 'inlineComment', text: 'shared' },
    { id: 'b', annotationType: 'inlineComment', text: 'shared' },
  ];
  const rsame = reapplyAnnotations(doc(para(text('shared'))), same);
  equal(rsame.preserved.length, 2);
  equal(rsame.ambiguous.length, 0);
  deepEqual(rsame.doc.content[0].content[0].marks, [ann('a'), ann('b')]);

  // two comments sharing an anchor text over two occurrences are BOTH refused —
  // each occurrence is a candidate for each id, so neither can be placed safely.
  // ponytail: the old first-match behaviour paired them in document order and
  // was right when comment order matched text order; refusing is the safe
  // default. Upgrade path if it bites: pair by document order.
  const rt = reapplyAnnotations(doc(para(text('dup ')), para(text('dup '))), [
    { id: 'a', annotationType: 'inlineComment', text: 'dup ' },
    { id: 'b', annotationType: 'inlineComment', text: 'dup ' },
  ]);
  equal(rt.ambiguous.length, 2);
  equal(rt.preserved.length, 0);

  // a repeat INSIDE one text node is two candidates, not one — counting nodes
  // instead of occurrences let this through and marked the first silently
  const twiceInOne = [{ id: 'r', annotationType: 'inlineComment', text: 'attributes' }];
  const rIn = reapplyAnnotations(doc(para(text('set attributes before reading attributes'))), twiceInOne);
  deepEqual(rIn.ambiguous.map((a) => a.id), ['r']);
  deepEqual(rIn.doc.content[0].content[0].marks, undefined);

  // same repeat, but reached through the structural locator — the primary path
  const priorRepeat = doc(para(text('set '), text('attributes', [ann('r2')]), text(' before reading attributes')));
  const locRepeat = must(locateAnnotation(priorRepeat, 'r2'));
  const flatRepeat = doc(para(text('set attributes before reading attributes')));
  equal(applyLocator(flatRepeat, locRepeat, 'r2').status, 'ambiguous');

  // empty/whitespace anchor is never applied
  equal(reapplyAnnotations(doc(para(text('x'))), [{ id: 'z', annotationType: 'inlineComment', text: ' ' }]).dropped.length, 1);
  deepEqual(reapplyAnnotations(doc(), []), { doc: doc(), preserved: [], dropped: [], ambiguous: [] });

  // ---- locateAnnotation / applyLocator ----
  // Shapes and expectations mirror the real page this was built for: a
  // field-reference table (header row 'JSON key'…) whose first column holds the
  // field name, plus an h2 whose text IS the anchor.
  const cell = (...content: any[]) => ({ type: 'tableCell', content });
  const row = (...content: any[]) => ({ type: 'tableRow', content });
  const p = (t: string, marks?: any[]) => para(text(t, marks));
  const fieldTable = (keyRowMarks?: any[]) =>
    ({
      type: 'table',
      content: [
        row(cell(p('JSON key')), cell(p('Type')), cell(p('Notes'))),
        row(cell(p('unique_id', keyRowMarks)), cell(p('string')), cell(p('the source_data key'))),
        row(cell(p('attributes')), cell(p('object')), cell(p('your payload'))),
      ],
    });

  // locate: table cell, keyed by header + first-column value, not by index
  const prior = doc(fieldTable([ann('m1')]), { type: 'heading', attrs: { level: 2 }, content: [text('Field reference', [ann('m2')])] });
  deepEqual(locateAnnotation(prior, 'm1'), {
    kind: 'tableCell', header: ['JSON key', 'Type', 'Notes'], rowKey: 'unique_id', cell: 0,
    text: 'unique_id', annotationType: 'inlineComment',
  });
  deepEqual(locateAnnotation(prior, 'm2'), {
    kind: 'block', blockType: 'heading', blockText: 'Field reference',
    text: 'Field reference', annotationType: 'inlineComment',
  });
  equal(locateAnnotation(prior, 'nope'), null);

  // apply: lands on the field-name cell even though 'unique_id' also appears in
  // another row's Notes column — the bug that motivated this resolver
  const noisy = doc({
    type: 'table',
    content: [
      row(cell(p('JSON key')), cell(p('Type')), cell(p('Notes'))),
      row(cell(p('tenant_id')), cell(p('string')), cell(p('pairs with unique_id'))),
      row(cell(p('unique_id')), cell(p('string')), cell(p('the source_data key'))),
    ],
  });
  const applied = applyLocator(noisy, must(locateAnnotation(prior, 'm1')), 'm1');
  equal(applied.status, 'exact');
  deepEqual(applied.doc.content[0].content[2].content[0].content[0].content, [text('unique_id', [ann('m1')])]);
  // the decoy row is untouched
  deepEqual(applied.doc.content[0].content[1].content[2].content[0].content, [text('pairs with unique_id')]);

  // apply: row inserted above the target shifts every index, rowKey still finds it
  const shifted = doc({
    type: 'table',
    content: [
      row(cell(p('JSON key')), cell(p('Type')), cell(p('Notes'))),
      row(cell(p('event_name')), cell(p('string')), cell(p('added later'))),
      row(cell(p('unique_id')), cell(p('string')), cell(p('the source_data key'))),
      row(cell(p('attributes')), cell(p('object')), cell(p('your payload'))),
    ],
  });
  equal(applyLocator(shifted, must(locateAnnotation(prior, 'm1')), 'm1').status, 'exact');

  // ambiguous: two rows share the key, so there is no single right answer
  const dupKey = doc({
    type: 'table',
    content: [
      row(cell(p('JSON key')), cell(p('Type')), cell(p('Notes'))),
      row(cell(p('unique_id')), cell(p('string')), cell(p('one'))),
      row(cell(p('unique_id')), cell(p('string')), cell(p('two'))),
    ],
  });
  const amb = applyLocator(dupKey, must(locateAnnotation(prior, 'm1')), 'm1');
  equal(amb.status, 'ambiguous');
  equal(JSON.stringify(amb.doc), JSON.stringify(dupKey)); // must not mark anything

  // lost: the row is gone, and separately, the table header changed
  const rowGone = doc({
    type: 'table',
    content: [row(cell(p('JSON key')), cell(p('Type')), cell(p('Notes'))), row(cell(p('attributes')), cell(p('object')), cell(p('x')))],
  });
  equal(applyLocator(rowGone, must(locateAnnotation(prior, 'm1')), 'm1').status, 'lost');
  equal(applyLocator(doc({
    type: 'table',
    content: [row(cell(p('Field')), cell(p('Type')), cell(p('Notes'))), row(cell(p('unique_id')), cell(p('string')), cell(p('x')))],
  }), must(locateAnnotation(prior, 'm1')), 'm1').status, 'lost');
  // lost: heading text reworded
  equal(applyLocator(doc({ type: 'heading', attrs: { level: 2 }, content: [text('Fields')] }), must(locateAnnotation(prior, 'm2')), 'm2').status, 'lost');
  // exact: heading unchanged
  equal(applyLocator(doc({ type: 'heading', attrs: { level: 2 }, content: [text('Field reference')] }), must(locateAnnotation(prior, 'm2')), 'm2').status, 'exact');

  // unmatchable, NOT lost: the block survives but the anchor spans two text
  // nodes, so it cannot be marked as one run — the reason must say so
  const spanning = doc(para(text('fix '), text('this', [ann('m3'), { type: 'strong' }]), text(' bug')));
  const spanLoc = must(locateAnnotation(spanning, 'm3'));
  equal(spanLoc.text, 'this');
  const splitAnchor = doc(para(text('fix '), text('th'), text('is bug')));
  equal(applyLocator(splitAnchor, { ...spanLoc, text: 'this bug' }, 'm3').status, 'unmatchable');
  // and genuinely-gone text still reports lost
  equal(applyLocator(doc(para(text('unrelated'))), { ...spanLoc, text: 'this bug' }, 'm3').status, 'lost');

  // lost, NOT unmatchable: the host row survives but the anchored field was
  // renamed away. A surviving host must not be read as surviving text.
  const priorRenamed = doc({
    type: 'table',
    content: [
      row(cell(p('JSON key')), cell(p('Type')), cell(p('Notes'))),
      row(
        cell(p('event_name')),
        cell(p('string')),
        cell(para(text('must match an '), text('alert_config', [ann('m4')]))),
      ),
    ],
  });
  const renamedLoc = must(locateAnnotation(priorRenamed, 'm4'));
  equal(renamedLoc.kind === 'tableCell' && renamedLoc.rowKey, 'event_name');
  const renamedNow = doc({
    type: 'table',
    content: [
      row(cell(p('JSON key')), cell(p('Type')), cell(p('Notes'))),
      row(cell(p('event_name')), cell(p('string')), cell(p('must match a configured alert or notification'))),
    ],
  });
  equal(applyLocator(renamedNow, renamedLoc, 'm4').status, 'lost');

  console.log('annotations: ok');
}
