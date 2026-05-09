import { ConfluenceClient } from '../clients/confluence-client.js';
import { ConfluencePage, ConfluenceAttachment, ConfluenceImage, ConfluenceComment, SearchOptions } from '../types.js';
import { markdownToADF } from '../formatters/index.js';
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
    // CQL search stays on v1 — v2 has no equivalent. Body returned by v1 is
    // storage-format HTML (a string); ConfluencePage.content is `any` so this
    // is allowed but consumers should treat search results as opaque.
    const { query, limit = 25, startAt = 0, expand = ['body.storage', 'version', 'space'] } = options;

    const cql = query ? `text ~ "${query}"` : '';
    const params: any = {
      cql,
      limit,
      start: startAt,
      expand: expand.join(','),
    };

    const response = await this.client.get<any>(`${ConfluenceService.V1}/search`, params);

    return (response.results ?? []).map((page: any) => ({
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value ?? '',
      spaceKey: page.space?.key ?? '',
      version: page.version?.number ?? 1,
      created: page.created ?? '',
      updated: page.updated ?? '',
    }));
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

  async updatePage(pageId: string, title: string, content: string, version: number): Promise<ConfluencePage> {
    const data = {
      id: pageId,
      status: 'current',
      title,
      body: this.adfBodyEnvelope(content),
      version: { number: version + 1, message: '' },
    };

    const page = await this.client.put<any>(
      `${ConfluenceService.V2}/pages/${pageId}?${ConfluenceService.BODY_FORMAT_QS}`,
      data,
    );
    return this.mapV2Page(page);
  }

  async deletePage(pageId: string): Promise<void> {
    await this.client.delete(`${ConfluenceService.V2}/pages/${pageId}`);
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

  // ---------- Comments (footer comments) ----------

  async getComments(pageId: string): Promise<ConfluenceComment[]> {
    const response = await this.client.get<any>(
      `${ConfluenceService.V2}/pages/${pageId}/footer-comments`,
      { 'body-format': ConfluenceService.REPRESENTATION },
    );

    return (response?.results ?? []).map((comment: any): ConfluenceComment => ({
      id: String(comment?.id ?? ''),
      body: this.parseAdfBody(comment?.body),
      // v2 does not return author displayName — only authorId — so we fall
      // back to the id (or "Unknown") to preserve the public shape.
      author: comment?.version?.authorId ?? 'Unknown',
      authorAccountId: comment?.version?.authorId,
      created: comment?.version?.createdAt ?? '',
      updated: comment?.version?.createdAt ?? '',
      version: comment?.version?.number ?? 1,
    }));
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

    return {
      id: String(comment?.id ?? ''),
      body: this.parseAdfBody(comment?.body) ?? body,
      author: comment?.version?.authorId ?? 'Unknown',
      authorAccountId: comment?.version?.authorId,
      created: comment?.version?.createdAt ?? '',
      updated: comment?.version?.createdAt ?? '',
      version: comment?.version?.number ?? 1,
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
      id: String(comment?.id ?? ''),
      body: this.parseAdfBody(comment?.body) ?? body,
      author: comment?.version?.authorId ?? 'Unknown',
      authorAccountId: comment?.version?.authorId,
      created: comment?.version?.createdAt ?? '',
      updated: comment?.version?.createdAt ?? '',
      version: comment?.version?.number ?? 1,
    };
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.client.delete(`${ConfluenceService.V2}/footer-comments/${commentId}`);
  }
}
