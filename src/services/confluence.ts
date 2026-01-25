import { ConfluenceClient } from '../clients/confluence-client.js';
import { ConfluencePage, ConfluenceAttachment, ConfluenceImage, ConfluenceComment, SearchOptions } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

export class ConfluenceService {
  private client: ConfluenceClient;

  constructor() {
    this.client = new ConfluenceClient();
  }

  /**
   * Get file buffer from either base64 content or file path
   */
  private async getFileBuffer(fileContent?: string, filePath?: string): Promise<Buffer> {
    if (filePath) {
      // Read from file path
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      return fs.readFileSync(filePath);
    } else if (fileContent) {
      // Decode from base64
      return Buffer.from(fileContent, 'base64');
    } else {
      throw new Error('Either fileContent (base64) or filePath must be provided');
    }
  }

  /**
   * Extract filename from file path
   */
  private getFilenameFromPath(filePath: string): string {
    return path.basename(filePath);
  }

  async searchPages(options: SearchOptions = {}): Promise<ConfluencePage[]> {
    const { query, limit = 25, startAt = 0, expand = ['body.storage', 'version', 'space'] } = options;

    let cql = '';
    if (query) {
      cql = `text ~ "${query}"`;
    }

    const params: any = {
      cql,
      limit,
      start: startAt,
      expand: expand.join(',')
    };

    const response = await this.client.get<any>('/wiki/rest/api/content/search', params);

    return response.results.map((page: any) => ({
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || '',
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    }));
  }

  async getPage(pageId: string, expand: string[] = ['body.storage', 'version', 'space']): Promise<ConfluencePage> {
    const params = {
      expand: expand.join(',')
    };

    const page = await this.client.get<any>(`/wiki/rest/api/content/${pageId}`, params);

    return {
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || '',
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    };
  }

  async createPage(spaceKey: string, title: string, content: string, parentId?: string): Promise<ConfluencePage> {
    const data: any = {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };

    if (parentId) {
      data.ancestors = [{ id: parentId }];
    }

    const page = await this.client.post<any>('/wiki/rest/api/content', data);

    return {
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || '',
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    };
  }

  async updatePage(pageId: string, title: string, content: string, version: number): Promise<ConfluencePage> {
    const data = {
      version: { number: version + 1 },
      title,
      type: 'page',
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };

    const page = await this.client.put<any>(`/wiki/rest/api/content/${pageId}`, data);

    return {
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || '',
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    };
  }

  async deletePage(pageId: string): Promise<void> {
    await this.client.delete(`/wiki/rest/api/content/${pageId}`);
  }

  async getSpaces(limit: number = 25): Promise<any[]> {
    const params = {
      limit,
      expand: 'description.plain'
    };

    const response = await this.client.get<any>('/wiki/rest/api/space', params);
    return response.results;
  }

  async getPagesBySpace(spaceKey: string, limit: number = 25): Promise<ConfluencePage[]> {
    const params = {
      spaceKey,
      limit,
      expand: 'body.storage,version'
    };

    const response = await this.client.get<any>('/wiki/rest/api/content', params);

    return response.results.map((page: any) => ({
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || spaceKey,
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    }));
  }

  async getAttachments(pageId: string): Promise<ConfluenceAttachment[]> {
    const response = await this.client.get<any>(`/wiki/rest/api/content/${pageId}/child/attachment`, {
      expand: 'version'
    });

    return response.results?.map((att: any) => ({
      id: att.id,
      title: att.title,
      filename: att.title,
      mediaType: att.metadata?.mediaType || '',
      fileSize: att.extensions?.fileSize || 0,
      created: att.history?.created?.when || '',
      downloadUrl: att._links?.download || ''
    })) || [];
  }

  async addAttachment(
    pageId: string,
    filename?: string,
    fileContent?: string,
    filePath?: string
  ): Promise<any> {
    const FormData = (await import('form-data')).default;
    const form = new FormData();

    const buffer = await this.getFileBuffer(fileContent, filePath);
    const finalFilename = filename || (filePath ? this.getFilenameFromPath(filePath) : 'attachment');

    form.append('file', buffer, { filename: finalFilename });

    const response = await this.client.postFormData(`/wiki/rest/api/content/${pageId}/child/attachment`, form);
    return response;
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.client.delete(`/wiki/rest/api/content/${attachmentId}`);
  }

  async embedImage(
    pageId: string,
    filename?: string,
    fileContent?: string,
    filePath?: string,
    options: {
      alt?: string;
      caption?: string;
      width?: number;
      align?: 'left' | 'center' | 'right';
      position?: 'top' | 'bottom' | 'after-heading';
      headingText?: string;
    } = {}
  ): Promise<{ page: ConfluencePage; attachment: any }> {
    // Determine filename
    const finalFilename = filename || (filePath ? this.getFilenameFromPath(filePath) : 'image');

    // Step 1: Attach the image
    const attachment = await this.addAttachment(pageId, finalFilename, fileContent, filePath);

    // Step 2: Get current page content and version
    const currentPage = await this.getPage(pageId);

    // Step 3: Build image markup
    const alt = options.alt || finalFilename;
    const alignAttr = options.align ? ` ac:align="${options.align}" ac:layout="${options.align}"` : '';
    const widthAttr = options.width ? ` ac:custom-width="true" ac:width="${options.width}"` : '';

    let imageMarkup = `<ac:image${alignAttr}${widthAttr} ac:alt="${alt}"><ri:attachment ri:filename="${finalFilename}" />`;

    if (options.caption) {
      imageMarkup += `<ac:caption><p>${options.caption}</p></ac:caption>`;
    }
    imageMarkup += '</ac:image>';

    // Step 4: Insert image at specified position
    let updatedContent = currentPage.content;
    const position = options.position || 'bottom';

    if (position === 'top') {
      updatedContent = imageMarkup + '\n' + updatedContent;
    } else if (position === 'after-heading' && options.headingText) {
      // Find the heading and insert after it
      const headingRegex = new RegExp(`(<h[1-6][^>]*>.*?${options.headingText}.*?</h[1-6]>)`, 'i');
      const match = updatedContent.match(headingRegex);
      if (match) {
        updatedContent = updatedContent.replace(headingRegex, `$1\n${imageMarkup}`);
      } else {
        // Fallback to bottom if heading not found
        updatedContent = updatedContent + '\n' + imageMarkup;
      }
    } else {
      // Default: bottom
      updatedContent = updatedContent + '\n' + imageMarkup;
    }

    // Step 5: Update the page
    const updatedPage = await this.updatePage(pageId, currentPage.title, updatedContent, currentPage.version);

    return { page: updatedPage, attachment };
  }

  async createPageWithImages(
    spaceKey: string,
    title: string,
    content: string,
    parentId?: string,
    images?: ConfluenceImage[]
  ): Promise<ConfluencePage> {
    // First create the page
    const page = await this.createPage(spaceKey, title, content, parentId);

    if (images && images.length > 0) {
      // Upload each image and collect their attachment info
      const uploadedImages: Array<ConfluenceImage & { attachmentId?: string; resolvedFilename: string }> = [];

      for (const image of images) {
        try {
          const resolvedFilename = image.filename || (image.filePath ? this.getFilenameFromPath(image.filePath) : 'image');
          const attachment = await this.addAttachment(page.id, resolvedFilename, image.fileContent, image.filePath);
          uploadedImages.push({
            ...image,
            filename: resolvedFilename,
            resolvedFilename,
            attachmentId: attachment.results?.[0]?.id
          });
        } catch (error) {
          console.warn(`Failed to upload image ${image.filename || image.filePath}:`, error);
        }
      }

      // If we have uploaded images, update the page content to include image references
      if (uploadedImages.length > 0) {
        let updatedContent = content;
        const imagesWithoutPlaceholder: typeof uploadedImages = [];

        for (const img of uploadedImages) {
          const imageMarkup = this.buildImageMarkup(img);
          const fname = img.resolvedFilename || img.filename || 'image';

          // Check for placeholder {{IMAGE:filename}}
          const placeholder = new RegExp(`\\{\\{IMAGE:${fname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'gi');

          if (placeholder.test(updatedContent)) {
            // Replace placeholder with image markup
            updatedContent = updatedContent.replace(placeholder, imageMarkup);
          } else {
            // No placeholder found, add to list for appending at end
            imagesWithoutPlaceholder.push(img);
          }
        }

        // Append images without placeholders at the end
        if (imagesWithoutPlaceholder.length > 0) {
          const appendedMarkup = imagesWithoutPlaceholder
            .map(img => this.buildImageMarkup(img))
            .join('\n');
          updatedContent += `\n\n${appendedMarkup}`;
        }

        // Update the page with the new content
        await this.updatePage(page.id, title, updatedContent, page.version);
      }
    }

    return page;
  }

  private buildImageMarkup(image: ConfluenceImage & { resolvedFilename?: string }): string {
    const filename = image.resolvedFilename || image.filename || 'image';
    const alt = image.alt || filename;
    const alignAttr = image.align ? ` ac:align="${image.align}" ac:layout="${image.align}"` : '';
    const widthAttr = image.width ? ` ac:custom-width="true" ac:width="${image.width}"` : '';

    let markup = `<ac:image${alignAttr}${widthAttr} ac:alt="${alt}"><ri:attachment ri:filename="${filename}" />`;

    if (image.caption) {
      markup += `<ac:caption><p>${image.caption}</p></ac:caption>`;
    }
    markup += '</ac:image>';

    return markup;
  }

  // Comment Methods

  async getComments(pageId: string): Promise<ConfluenceComment[]> {
    const params = {
      expand: 'body.storage,version,history'
    };

    const response = await this.client.get<any>(`/wiki/rest/api/content/${pageId}/child/comment`, params);

    return response.results?.map((comment: any) => ({
      id: comment.id,
      body: comment.body?.storage?.value || '',
      author: comment.history?.createdBy?.displayName || 'Unknown',
      authorAccountId: comment.history?.createdBy?.accountId,
      created: comment.history?.createdDate || '',
      updated: comment.version?.when || '',
      version: comment.version?.number || 1
    })) || [];
  }

  async addComment(pageId: string, body: string): Promise<ConfluenceComment> {
    const data = {
      type: 'comment',
      container: {
        id: pageId,
        type: 'page'
      },
      body: {
        storage: {
          value: body,
          representation: 'storage'
        }
      }
    };

    const comment = await this.client.post<any>('/wiki/rest/api/content', data);

    return {
      id: comment.id,
      body: comment.body?.storage?.value || body,
      author: comment.history?.createdBy?.displayName || 'Unknown',
      authorAccountId: comment.history?.createdBy?.accountId,
      created: comment.history?.createdDate || '',
      updated: comment.version?.when || '',
      version: comment.version?.number || 1
    };
  }

  async updateComment(commentId: string, body: string, version: number): Promise<ConfluenceComment> {
    const data = {
      type: 'comment',
      version: { number: version + 1 },
      body: {
        storage: {
          value: body,
          representation: 'storage'
        }
      }
    };

    const comment = await this.client.put<any>(`/wiki/rest/api/content/${commentId}`, data);

    return {
      id: comment.id,
      body: comment.body?.storage?.value || body,
      author: comment.history?.createdBy?.displayName || 'Unknown',
      authorAccountId: comment.history?.createdBy?.accountId,
      created: comment.history?.createdDate || '',
      updated: comment.version?.when || '',
      version: comment.version?.number || 1
    };
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.client.delete(`/wiki/rest/api/content/${commentId}`);
  }
}