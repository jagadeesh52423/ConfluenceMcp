import { ConfluenceClient } from '../clients/confluence-client.js';
import { ConfluencePage, ConfluenceAttachment, ConfluenceImage, ConfluenceComment, ConfluenceCommentType, ConfluenceCommentFilter, InlineCommentRepair, SearchOptions } from '../types.js';
import {
  markdownToADF,
  collectAnnotations,
  reapplyAnnotations,
  locateAnnotation,
  applyLocator,
} from '../formatters/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Confluence service.
 *
 * Endpoint policy (Phase 3):
 *   - Pages, spaces, page children, versions, footer-comments, attachment
 *     reads/deletes use the v2 API (`/wiki/api/v2/...`) with bodies in ADF
 *     (`representation: "atlas_doc_format"`, value = JSON-stringified ADF).
 *   - CQL search stays on v1 (`/wiki/rest/api/search`) — v2 has no equivalent.
 *   - Attachment upload stays on v1 (`/wiki/rest/api/content/{id}/child/attachment`)
 *     — v2 has no upload endpoint; only read/delete.
 *   - Label *writes* stay on v1 (`/wiki/rest/api/content/{id}/label[/...]`) — v2
 *     exposes only label *reads* on pages. Reads use v2.
 *
 * Body format:
 *   - Submit: body.atlas_doc_format.value = JSON.stringify(adf), representation
 *     = "atlas_doc_format".
 *   - Read: append `?body-format=atlas_doc_format` to GETs that need a body and
 *     parse `body.atlas_doc_format.value` (a JSON string) back into an object.
 */
export class ConfluenceService {
  private static readonly V2 = '/wiki/api/v2';
  private static readonly V1 = '/wiki/rest/api';
  private static readonly REPRESENTATION = 'atlas_doc_format';
  private static readonly BODY_FORMAT_QS = 'body-format=atlas_doc_format';

  private client: ConfluenceClient;
  // Cache of spaceKey → spaceId for the duration of a single service instance.
  // v2 page write endpoints take spaceId, but the public MCP tools still
  // accept spaceKey for backwards compatibility.
  private readonly spaceIdByKey = new Map<string, string>();

  constructor() {
    this.client = new ConfluenceClient();
  }

  // ---------- Internal helpers ----------

  /**
   * Get file buffer from either base64 content or file path
   */
  private async getFileBuffer(fileContent?: string, filePath?: string): Promise<Buffer> {
    if (filePath) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      return fs.readFileSync(filePath);
    } else if (fileContent) {
      return Buffer.from(fileContent, 'base64');
    } else {
      throw new Error('Either fileContent (base64) or filePath must be provided');
    }
  }

  private getFilenameFromPath(filePath: string): string {
    return path.basename(filePath);
  }

  /**
   * Resolve a Confluence space key (e.g. "ENG") to its v2 numeric space id.
   * v2 endpoints accept space `id`, not `key`. Cached per service instance.
   */
  private async resolveSpaceId(spaceKey: string): Promise<string> {
    const cached = this.spaceIdByKey.get(spaceKey);
    if (cached) return cached;

    const response = await this.client.get<any>(`${ConfluenceService.V2}/spaces`, { keys: spaceKey });
    const space = response?.results?.[0];
    if (!space?.id) {
      throw new Error(`Confluence space not found for key "${spaceKey}"`);
    }
    const id = String(space.id);
    this.spaceIdByKey.set(spaceKey, id);
    return id;
  }

  /**
   * Parse the ADF JSON string from a v2 page/comment body envelope.
   * Returns the parsed ADF object, or null if no body was returned.
   */
  private parseAdfBody(body: any): any {
    const value = body?.atlas_doc_format?.value;
    if (!value || typeof value !== 'string') return null;
    try {
      return JSON.parse(value);
    } catch {
      // Should not happen — Confluence always returns valid JSON here — but
      // surfacing the raw string is more useful than throwing.
      return value;
    }
  }

  /**
   * Build a write body envelope with ADF representation.
   */
  private adfBodyEnvelope(markdown: string): { representation: string; value: string } {
    return {
      representation: ConfluenceService.REPRESENTATION,
      value: JSON.stringify(markdownToADF(markdown)),
    };
  }

  /**
   * Map a v2 page response to our public ConfluencePage shape.
   * v2 returns `spaceId` (not `space.key`) and timestamps under different
   * paths than v1 — the caller may pass a known `spaceKey` to fill that
   * field; otherwise it's left empty.
   */
  private mapV2Page(page: any, spaceKey: string = ''): ConfluencePage {
    return {
      id: String(page?.id ?? ''),
      title: page?.title ?? '',
      content: this.parseAdfBody(page?.body),
      spaceKey,
      version: page?.version?.number ?? 1,
      created: page?.createdAt ?? page?.version?.createdAt ?? '',
      updated: page?.version?.createdAt ?? '',
    };
  }

  // ---------- Pages ----------

  async searchPages(options: SearchOptions = {}): Promise<ConfluencePage[]> {
    // CQL search stays on v1 — v2 has no equivalent. Body is not expanded by
    // default (payload); results carry `excerpt` instead and `content` is ''
    // unless the caller expands content.body.storage.
    const { query, cql: rawCql, limit = 25, startAt = 0, expand = ['content.version', 'content.space', 'content.history'] } = options;

    if (!query && !rawCql) {
      throw new Error('Either query or cql must be provided');
    }
    const escaped = (query ?? '').replace(/[\\"]/g, '\\$&');
    const cql = rawCql || `type = page AND text ~ "${escaped}"`;
    const params: any = {
      cql,
      limit,
      start: startAt,
      expand: expand.join(','),
    };

    const response = await this.client.get<any>(`${ConfluenceService.V1}/search`, params);

    return (response.results ?? []).map((result: any) => {
      const page = result.content ?? result;
      return {
        id: page.id,
        title: page.title ?? result.title,
        content: page.body?.storage?.value ?? '',
        spaceKey: page.space?.key ?? '',
        version: page.version?.number ?? 1,
        created: page.history?.createdDate ?? '',
        updated: result.lastModified ?? page.version?.when ?? '',
        excerpt: result.excerpt,
        url: result.url,
      };
    });
  }

  async getPage(pageId: string): Promise<ConfluencePage> {
    const page = await this.client.get<any>(
      `${ConfluenceService.V2}/pages/${pageId}?${ConfluenceService.BODY_FORMAT_QS}`,
    );
    return this.mapV2Page(page);
  }

  async createPage(spaceKey: string, title: string, content: string, parentId?: string): Promise<ConfluencePage> {
    const spaceId = await this.resolveSpaceId(spaceKey);

    const data: any = {
      spaceId,
      status: 'current',
      title,
      body: this.adfBodyEnvelope(content),
    };
    if (parentId) data.parentId = parentId;

    const page = await this.client.post<any>(
      `${ConfluenceService.V2}/pages?${ConfluenceService.BODY_FORMAT_QS}`,
      data,
    );
    return this.mapV2Page(page, spaceKey);
  }

  /**
   * Replace a page body, carrying inline-comment anchors over to the new text.
   *
   * Inline comments are `annotation` marks inside the body, so a body rebuilt
   * from markdown would drop every one of them. We read the live body first and
   * re-anchor each marker onto text that survived the edit; `inlineComments`
   * reports what could and could not be re-anchored.
   *
   * ponytail: costs one extra GET per update — there is no way to know whether
   * a page carries markers without reading it.
   */
  async updatePage(
    pageId: string,
    title: string,
    content: string,
    version: number,
  ): Promise<
    ConfluencePage & { inlineComments?: { preserved: number; dropped: string[]; ambiguous: string[] } }
  > {
    const current = await this.client.get<any>(
      `${ConfluenceService.V2}/pages/${pageId}?${ConfluenceService.BODY_FORMAT_QS}`,
    );
    const priorBody = this.parseAdfBody(current?.body);
    const annotations = collectAnnotations(priorBody);

    // Structural locator first — it knows which table row or block the comment
    // sat in, so it resolves anchors whose text repeats elsewhere on the page.
    // Unambiguous text search is the fallback for text that moved between
    // blocks. Neither guesses: an anchor matching several places is reported.
    let doc = markdownToADF(content);
    const preserved: string[] = [];
    const ambiguous: string[] = [];
    const dropped: string[] = [];
    for (const annotation of annotations) {
      const locator = locateAnnotation(priorBody, annotation.id);
      if (locator) {
        const applied = applyLocator(doc, locator, annotation.id);
        if (applied.status === 'exact') {
          doc = applied.doc;
          preserved.push(annotation.text);
          continue;
        }
        if (applied.status === 'ambiguous') {
          ambiguous.push(annotation.text);
          continue;
        }
      }
      const fallback = reapplyAnnotations(doc, [annotation]);
      doc = fallback.doc;
      if (fallback.preserved.length) preserved.push(annotation.text);
      else if (fallback.ambiguous.length) ambiguous.push(annotation.text);
      else dropped.push(annotation.text);
    }

    const data = {
      id: pageId,
      status: 'current',
      title,
      body: { representation: ConfluenceService.REPRESENTATION, value: JSON.stringify(doc) },
      version: { number: version + 1, message: '' },
    };

    const page = await this.client.put<any>(
      `${ConfluenceService.V2}/pages/${pageId}?${ConfluenceService.BODY_FORMAT_QS}`,
      data,
    );
    const mapped = this.mapV2Page(page);
    return annotations.length
      ? { ...mapped, inlineComments: { preserved: preserved.length, dropped, ambiguous } }
      : mapped;
  }

  async deletePage(pageId: string): Promise<void> {
    await this.client.delete(`${ConfluenceService.V2}/pages/${pageId}`);
  }

  /**
   * Body ADF of a superseded page version. v2 has no historical-body endpoint.
   * Returns null when that version cannot be read — Confluence trims and purges
   * old versions, and one unreadable version must not abort a whole repair.
   */
  private async getHistoricalBody(pageId: string, version: number): Promise<any> {
    try {
      const page = await this.client.get<any>(`${ConfluenceService.V1}/content/${pageId}`, {
        status: 'historical',
        version,
        expand: `body.${ConfluenceService.REPRESENTATION}`,
      });
      return this.parseAdfBody(page?.body);
    } catch {
      return null;
    }
  }

  /**
   * ponytail: cap the history walk. One unlocatable comment on a long-lived
   * page would otherwise mean hundreds of sequential full-body fetches. Raise
   * it, or fetch versions concurrently, if a real page needs deeper history.
   */
  private static readonly MAX_HISTORY_LOOKBACK = 50;

  /** Explicit comment page size; the v2 default of 25 truncates silently. */
  private static readonly COMMENT_PAGE_SIZE = 250;

  /** Whether the last fetch of `pageId:kind` had a further page. */
  private truncatedComments = new Map<string, boolean>();

  /**
   * Re-attach inline comments detached by an earlier page update.
   *
   * An inline comment anchors via an `annotation` mark in the page body, so any
   * update that rebuilt the body from markdown stripped every marker and left
   * the comments floating. This walks back through page history to find where
   * each orphan was anchored, then re-marks that text in the current body.
   *
   * Only unambiguous matches are written. An anchor that now matches several
   * places, or none, is reported untouched — silently re-attaching a reviewer's
   * question to the wrong sentence is worse than leaving it detached.
   *
   * Text is never modified; this adds marks only.
   */
  async reattachInlineComments(
    pageId: string,
    dryRunArg?: boolean,
  ): Promise<InlineCommentRepair> {
    // Only a literal false writes. A client sending null/0/"" for an unset
    // optional boolean must not trigger a live page write.
    const dryRun = dryRunArg !== false;
    const page = await this.client.get<any>(
      `${ConfluenceService.V2}/pages/${pageId}?${ConfluenceService.BODY_FORMAT_QS}`,
    );
    const currentBody = this.parseAdfBody(page?.body);
    if (!currentBody) throw new Error(`Page ${pageId} returned no ADF body — cannot re-attach comments.`);

    const version = page?.version?.number ?? 1;
    const allInline = await this.getComments(pageId, 'inline');
    // Repairing from a truncated list would under-report and under-repair while
    // the totals below looked authoritative — refuse rather than mislead.
    if (this.truncatedComments.get(`${pageId}:inline`)) {
      throw new Error(
        `Page ${pageId} has more than ${ConfluenceService.COMMENT_PAGE_SIZE} inline comments. ` +
          `This server does not follow comment pagination, so a repair would silently skip some. ` +
          `Re-attach is refused; reading comments still works.`,
      );
    }
    const inline = allInline.filter((c) => c.markerRef);
    const anchored = new Set(collectAnnotations(currentBody).map((a) => a.id));
    const orphans = inline.filter((c) => !anchored.has(c.markerRef!));
    const oldest = Math.max(1, version - ConfluenceService.MAX_HISTORY_LOOKBACK);

    const outcome: InlineCommentRepair = {
      pageId,
      version,
      dryRun,
      inlineComments: inline.length,
      stillAnchored: inline.length - orphans.length,
      reattached: [],
      ambiguous: [],
      lost: [],
    };
    if (orphans.length === 0) return outcome;

    // Cache history lookups — several orphans usually detached in the same edit.
    const history = new Map<number, any>();
    const unreadable = new Set<number>();
    const bodyAt = async (n: number) => {
      if (!history.has(n)) history.set(n, await this.getHistoricalBody(pageId, n));
      return history.get(n);
    };

    let doc = currentBody;
    for (const comment of orphans) {
      const markerRef = comment.markerRef!;
      const entry = { commentId: comment.id, markerRef, anchorText: comment.anchoredText ?? '' };

      let locator = null;
      for (let n = version - 1; n >= oldest && !locator; n--) {
        const body = await bodyAt(n);
        if (!body) {
          unreadable.add(n);
          continue;
        }
        locator = locateAnnotation(body, markerRef);
        if (locator) entry.anchorText = locator.text;
      }
      if (!locator) {
        outcome.lost.push({
          ...entry,
          reason:
            `no readable page version back to v${oldest} contains this marker` +
            (unreadable.size ? ` (could not read v${[...unreadable].join(', v')})` : ''),
        });
        continue;
      }

      const applied = applyLocator(doc, locator, markerRef);
      doc = applied.doc;
      if (applied.status === 'exact') outcome.reattached.push(entry);
      else if (applied.status === 'ambiguous')
        outcome.ambiguous.push({ ...entry, reason: 'anchor text matches more than one place in the current page' });
      else if (applied.status === 'unmatchable')
        outcome.ambiguous.push({
          ...entry,
          reason: 'the anchored text still exists but is broken up by other formatting, so it cannot be matched as one unbroken run',
        });
      else outcome.lost.push({ ...entry, reason: 'the text this comment was anchored to no longer exists' });
    }

    if (unreadable.size) outcome.unreadableVersions = [...unreadable].sort((a, b) => b - a);
    if (dryRun || outcome.reattached.length === 0) return outcome;

    const updated = await this.client.put<any>(
      `${ConfluenceService.V2}/pages/${pageId}?${ConfluenceService.BODY_FORMAT_QS}`,
      {
        id: pageId,
        status: 'current',
        title: page.title,
        body: { representation: ConfluenceService.REPRESENTATION, value: JSON.stringify(doc) },
        version: { number: version + 1, message: 'Re-attach inline comments orphaned by an earlier update' },
      },
    );
    outcome.newVersion = updated?.version?.number;
    return outcome;
  }

  // ---------- Spaces ----------

  async getSpaces(limit: number = 25): Promise<any[]> {
    const response = await this.client.get<any>(`${ConfluenceService.V2}/spaces`, { limit });
    return response?.results ?? [];
  }

  async getPagesBySpace(spaceKey: string, limit: number = 25): Promise<ConfluencePage[]> {
    const spaceId = await this.resolveSpaceId(spaceKey);

    const response = await this.client.get<any>(
      `${ConfluenceService.V2}/spaces/${spaceId}/pages`,
      { limit, 'body-format': ConfluenceService.REPRESENTATION },
    );

    return (response?.results ?? []).map((page: any) => this.mapV2Page(page, spaceKey));
  }

  // ---------- Page children ----------

  async getPageChildren(pageId: string, limit: number = 25): Promise<ConfluencePage[]> {
    // v2 children endpoint does not return body or version — only id, title,
    // status, spaceId, parentId, position, lastOwnerId, childPosition.
    const response = await this.client.get<any>(
      `${ConfluenceService.V2}/pages/${pageId}/children`,
      { limit },
    );

    return (response?.results ?? []).map((child: any): ConfluencePage => ({
      id: String(child?.id ?? ''),
      title: child?.title ?? '',
      content: null,
      spaceKey: '',
      version: 1,
      created: '',
      updated: '',
    }));
  }

  // ---------- Page version history ----------

  async getPageHistory(pageId: string, limit: number = 25): Promise<any[]> {
    // v2 versions response: { results: [{ createdAt, message, number,
    //   minorEdit, authorId }], _links }. v2 does NOT include the author's
    // displayName — only authorId — so `by` falls back to the id.
    const response = await this.client.get<any>(
      `${ConfluenceService.V2}/pages/${pageId}/versions`,
      { limit },
    );

    return (response?.results ?? []).map((version: any) => ({
      number: version.number,
      by: version.authorId ?? 'Unknown',
      byAccountId: version.authorId,
      when: version.createdAt ?? '',
      message: version.message ?? '',
      minorEdit: version.minorEdit ?? false,
    }));
  }

  // ---------- Labels ----------
  // v2 supports reading labels on pages but does NOT expose write endpoints.
  // Adding/removing labels therefore stays on v1.

  async getLabels(pageId: string): Promise<any[]> {
    const response = await this.client.get<any>(`${ConfluenceService.V2}/pages/${pageId}/labels`);
    return (response?.results ?? []).map((label: any) => ({
      prefix: label.prefix,
      name: label.name,
      id: label.id,
    }));
  }

  async addLabels(pageId: string, labels: string[]): Promise<any[]> {
    // v1 — v2 has no equivalent write endpoint for page labels.
    const data = labels.map(name => ({ prefix: 'global', name }));
    const response = await this.client.post<any>(`${ConfluenceService.V1}/content/${pageId}/label`, data);
    return (response?.results ?? []).map((label: any) => ({
      prefix: label.prefix,
      name: label.name,
      id: label.id,
    }));
  }

  async removeLabel(pageId: string, label: string): Promise<void> {
    // v1 — v2 has no equivalent.
    await this.client.delete(`${ConfluenceService.V1}/content/${pageId}/label/${encodeURIComponent(label)}`);
  }

  // ---------- Attachments ----------

  async getAttachments(pageId: string): Promise<ConfluenceAttachment[]> {
    const response = await this.client.get<any>(`${ConfluenceService.V2}/pages/${pageId}/attachments`);

    return (response?.results ?? []).map((att: any): ConfluenceAttachment => ({
      id: String(att?.id ?? ''),
      title: att?.title ?? '',
      filename: att?.title ?? '',
      mediaType: att?.mediaType ?? '',
      fileSize: att?.fileSize ?? 0,
      created: att?.createdAt ?? '',
      downloadUrl: att?.downloadLink ?? '',
    }));
  }

  async addAttachment(
    pageId: string,
    filename?: string,
    fileContent?: string,
    filePath?: string,
  ): Promise<any> {
    // v2 has no upload endpoint — multipart upload stays on v1.
    const FormData = (await import('form-data')).default;
    const form = new FormData();

    const buffer = await this.getFileBuffer(fileContent, filePath);
    const finalFilename = filename || (filePath ? this.getFilenameFromPath(filePath) : 'attachment');

    form.append('file', buffer, { filename: finalFilename });

    const response = await this.client.postFormData(
      `${ConfluenceService.V1}/content/${pageId}/child/attachment`,
      form,
    );
    return response;
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.client.delete(`${ConfluenceService.V2}/attachments/${attachmentId}`);
  }

  // ---------- Image embedding (NOT supported in ADF mode) ----------
  //
  // The pre-Phase-3 implementation built Confluence storage-format XHTML
  // (`<ac:image><ri:attachment .../></ac:image>`) and string-spliced it into
  // page bodies. With ADF as the only supported body format, that path would
  // corrupt page bodies (storage HTML is not valid ADF). Inserting a
  // first-class ADF `media`/`mediaSingle` node requires a Media API token
  // (collection + occurrenceKey + media id), which is out of scope for the
  // formatter swap.
  //
  // Behaviour: surface an explicit, actionable error rather than silently
  // emitting broken markup. The `addAttachment` path still works — callers
  // can upload the file and reference it in subsequent UI edits.

  private static readonly EMBED_NOT_SUPPORTED_MSG =
    'Image embedding is not supported in ADF mode. Use confluence_add_attachment to upload the file; ' +
    'embedding inline requires the Atlassian Media API and is not implemented in this version.';

  async embedImage(
    _pageId: string,
    _filename?: string,
    _fileContent?: string,
    _filePath?: string,
    _options: {
      alt?: string;
      caption?: string;
      width?: number;
      align?: 'left' | 'center' | 'right';
      position?: 'top' | 'bottom' | 'after-heading';
      headingText?: string;
    } = {},
  ): Promise<{ page: ConfluencePage; attachment: any }> {
    throw new Error(ConfluenceService.EMBED_NOT_SUPPORTED_MSG);
  }

  async createPageWithImages(
    spaceKey: string,
    title: string,
    content: string,
    parentId?: string,
    images?: ConfluenceImage[],
  ): Promise<ConfluencePage> {
    if (images && images.length > 0) {
      throw new Error(ConfluenceService.EMBED_NOT_SUPPORTED_MSG);
    }
    return this.createPage(spaceKey, title, content, parentId);
  }

  // ---------- Comments (footer + inline) ----------

  /**
   * Registry mapping each comment kind to the v2 sub-resource path and the
   * mapper that shapes its raw response. To support a new comment kind, add an
   * entry here — `getComments` and the tool layer require no other changes.
   */
  private static readonly COMMENT_SOURCES: Record<
    ConfluenceCommentType,
    { path: string; map: 'mapFooterComment' | 'mapInlineComment' }
  > = {
    footer: { path: 'footer-comments', map: 'mapFooterComment' },
    inline: { path: 'inline-comments', map: 'mapInlineComment' },
  };

  /**
   * Get comments for a page. `commentType` selects which kinds to return:
   *   - 'footer' — page-level (footer) comments only
   *   - 'inline' — text-anchored (inline) comments only
   *   - 'all'    — both kinds (default), each tagged via its `type` field
   *
   * Inline comments additionally carry `anchoredText` (the highlighted page
   * selection) and `resolutionStatus`. Footer comments leave those undefined.
   */
  async getComments(
    pageId: string,
    commentType: ConfluenceCommentFilter = 'all',
  ): Promise<ConfluenceComment[]> {
    const kinds: ConfluenceCommentType[] =
      commentType === 'all'
        ? (Object.keys(ConfluenceService.COMMENT_SOURCES) as ConfluenceCommentType[])
        : [commentType];

    const batches = await Promise.all(kinds.map((kind) => this.fetchComments(pageId, kind)));
    return batches.flat();
  }

  /** Fetch and shape a single comment kind for a page. */
  private async fetchComments(
    pageId: string,
    kind: ConfluenceCommentType,
  ): Promise<ConfluenceComment[]> {
    const source = ConfluenceService.COMMENT_SOURCES[kind];
    const response = await this.client.get<any>(
      `${ConfluenceService.V2}/pages/${pageId}/${source.path}`,
      { 'body-format': ConfluenceService.REPRESENTATION, limit: ConfluenceService.COMMENT_PAGE_SIZE },
    );
    // ponytail: single page. v2 defaults to 25, so the explicit limit covers any
    // realistic page; follow `_links.next` if one ever exceeds it. Reads stay
    // best-effort — only reattachInlineComments treats completeness as required.
    this.truncatedComments.set(`${pageId}:${kind}`, Boolean(response?._links?.next));
    const map = this[source.map].bind(this);
    return (response?.results ?? []).map((comment: any) => map(comment));
  }

  /**
   * Shape the version/author/body fields shared by every v2 comment kind.
   * v2 does not return author displayName — only authorId — so we fall back to
   * the id (or "Unknown") to preserve the public shape.
   */
  private mapBaseComment(comment: any): Omit<ConfluenceComment, 'type'> {
    return {
      id: String(comment?.id ?? ''),
      body: this.parseAdfBody(comment?.body),
      author: comment?.version?.authorId ?? 'Unknown',
      authorAccountId: comment?.version?.authorId,
      created: comment?.version?.createdAt ?? '',
      updated: comment?.version?.createdAt ?? '',
      version: comment?.version?.number ?? 1,
      webuiLink: comment?._links?.webui,
    };
  }

  private mapFooterComment(comment: any): ConfluenceComment {
    return { ...this.mapBaseComment(comment), type: 'footer' };
  }

  private mapInlineComment(comment: any): ConfluenceComment {
    const properties = comment?.properties ?? {};
    return {
      ...this.mapBaseComment(comment),
      type: 'inline',
      // Confluence exposes resolution under `resolutionStatus` (e.g. 'open',
      // 'resolved', 'reopened', 'dangling').
      resolutionStatus: comment?.resolutionStatus,
      // The anchored selection appears under both camelCase and kebab-case keys
      // depending on API revision — prefer camelCase, fall back to kebab-case.
      anchoredText:
        properties.inlineOriginalSelection ?? properties['inline-original-selection'],
      markerRef: properties.inlineMarkerRef ?? properties['inline-marker-ref'],
    };
  }

  async addComment(pageId: string, body: string): Promise<ConfluenceComment> {
    const data = {
      pageId,
      body: this.adfBodyEnvelope(body),
    };

    const comment = await this.client.post<any>(
      `${ConfluenceService.V2}/footer-comments?${ConfluenceService.BODY_FORMAT_QS}`,
      data,
    );

    // Reuse the shared base mapper for a consistent shape; keep the `?? body`
    // fallback since a freshly-created comment response may omit the body.
    return {
      ...this.mapBaseComment(comment),
      type: 'footer',
      body: this.parseAdfBody(comment?.body) ?? body,
    };
  }

  async updateComment(commentId: string, body: string, version: number): Promise<ConfluenceComment> {
    const data = {
      version: { number: version + 1, message: '' },
      body: this.adfBodyEnvelope(body),
    };

    const comment = await this.client.put<any>(
      `${ConfluenceService.V2}/footer-comments/${commentId}?${ConfluenceService.BODY_FORMAT_QS}`,
      data,
    );

    return {
      ...this.mapBaseComment(comment),
      type: 'footer',
      body: this.parseAdfBody(comment?.body) ?? body,
    };
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.client.delete(`${ConfluenceService.V2}/footer-comments/${commentId}`);
  }
}
