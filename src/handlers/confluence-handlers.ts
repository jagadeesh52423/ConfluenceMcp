import { ConfluenceService } from '../services/confluence.js';
import {
  ToolResponse,
  successResponse,
  jsonResponse,
  errorResponse,
  ERROR_TIPS,
  formatHelpers,
} from '../error-handler.js';
import { ICONS, ERROR_MESSAGES } from '../constants.js';

/**
 * Confluence tool handlers
 */
export class ConfluenceHandlers {
  constructor(private service: ConfluenceService) {}

  async searchPages(args: { query?: string; limit?: number }): Promise<ToolResponse> {
    const { query, limit } = args;
    try {
      const pages = await this.service.searchPages({ query, limit });
      return jsonResponse(pages);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to search Confluence pages',
        params: { Query: query || 'none', Limit: limit || 25 },
        tip: ERROR_TIPS.CONFLUENCE_SEARCH,
      });
    }
  }

  async getPage(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    try {
      const page = await this.service.getPage(pageId);
      return jsonResponse(page);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get Confluence page',
        params: { 'Page ID': pageId },
        tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW,
      });
    }
  }

  async createPage(args: {
    spaceKey: string;
    title: string;
    content: string;
    parentId?: string;
    images?: Array<{
      filename?: string;
      fileContent?: string;
      filePath?: string;
      alt?: string;
      caption?: string;
      width?: number;
      align?: 'left' | 'center' | 'right';
    }>;
  }): Promise<ToolResponse> {
    const { spaceKey, title, content, parentId, images } = args;
    try {
      const page = await this.service.createPageWithImages(spaceKey, title, content, parentId, images);
      const imageCount = images?.length || 0;
      const resultText = imageCount > 0
        ? `${ICONS.SUCCESS} Confluence page created successfully with ${imageCount} image(s)\n\n${JSON.stringify(page, null, 2)}`
        : JSON.stringify(page, null, 2);

      return successResponse(resultText);
    } catch (error: any) {
      const imageInfo = images?.length ? `\n- Images: ${images.length} image(s) to upload` : '';
      return errorResponse(error, {
        operation: 'Failed to create Confluence page',
        params: {
          'Space Key': spaceKey,
          Title: title,
          'Parent ID': parentId || 'none',
        },
        tip: ERROR_TIPS.CONFLUENCE_PAGE_CREATE + (images?.length ? ' For images, ensure they are properly base64 encoded.' : ''),
      });
    }
  }

  async updatePage(args: {
    pageId: string;
    title: string;
    content: string;
    version: number;
  }): Promise<ToolResponse> {
    const { pageId, title, content, version } = args;
    try {
      const page = await this.service.updatePage(pageId, title, content, version);
      return jsonResponse(page);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to update Confluence page',
        params: { 'Page ID': pageId, Title: title, Version: version },
        tip: ERROR_TIPS.CONFLUENCE_PAGE_EDIT,
      });
    }
  }

  async getSpaces(args: { limit?: number }): Promise<ToolResponse> {
    const { limit } = args;
    try {
      const spaces = await this.service.getSpaces(limit);
      return jsonResponse(spaces);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get Confluence spaces',
        params: { Limit: limit || 25 },
        tip: ERROR_TIPS.CONFLUENCE_SPACE,
      });
    }
  }

  async getPagesBySpace(args: { spaceKey: string; limit?: number }): Promise<ToolResponse> {
    const { spaceKey, limit } = args;
    try {
      const pages = await this.service.getPagesBySpace(spaceKey, limit);
      return jsonResponse(pages);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get pages from Confluence space',
        params: { 'Space Key': spaceKey, Limit: limit || 25 },
        tip: 'Check if the space key exists and you have permission to view it.',
      });
    }
  }

  async getAttachments(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    try {
      const attachments = await this.service.getAttachments(pageId);
      return jsonResponse(attachments);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get attachments for Confluence page',
        params: { 'Page ID': pageId },
        tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW,
      });
    }
  }

  async addAttachment(args: {
    pageId: string;
    filename?: string;
    fileContent?: string;
    filePath?: string;
  }): Promise<ToolResponse> {
    const { pageId, filename, fileContent, filePath } = args;

    if (!filePath && !fileContent) {
      return {
        content: [{ type: 'text', text: `${ICONS.ERROR} ${ERROR_MESSAGES.MISSING_FILE_INPUT}` }],
        isError: true,
      };
    }

    try {
      const result = await this.service.addAttachment(pageId, filename, fileContent, filePath);
      const attachedFilename = result.results?.[0]?.title || filename || filePath?.split('/').pop() || 'attachment';
      return successResponse(
        `${ICONS.SUCCESS} Attachment "${attachedFilename}" added successfully to page ${pageId}\n\n${JSON.stringify(result, null, 2)}`
      );
    } catch (error: any) {
      const source = filePath ? `File Path: ${filePath}` : `Filename: ${filename}`;
      return errorResponse(error, {
        operation: 'Failed to add attachment to Confluence page',
        params: { 'Page ID': pageId, [filePath ? 'File Path' : 'Filename']: filePath || filename },
        tip: ERROR_TIPS.CONFLUENCE_ATTACHMENT,
      });
    }
  }

  async deleteAttachment(args: { attachmentId: string }): Promise<ToolResponse> {
    const { attachmentId } = args;
    try {
      await this.service.deleteAttachment(attachmentId);
      return successResponse(`${ICONS.SUCCESS} Attachment ${attachmentId} deleted successfully`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to delete attachment',
        params: { 'Attachment ID': attachmentId },
        tip: 'Check if the attachment exists and you have permission to delete it.',
      });
    }
  }

  async embedImage(args: {
    pageId: string;
    filename?: string;
    fileContent?: string;
    filePath?: string;
    alt?: string;
    caption?: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    position?: 'top' | 'bottom' | 'after-heading';
    headingText?: string;
  }): Promise<ToolResponse> {
    const { pageId, filename, fileContent, filePath, alt, caption, width, align, position, headingText } = args;

    if (!filePath && !fileContent) {
      return {
        content: [{ type: 'text', text: `${ICONS.ERROR} ${ERROR_MESSAGES.MISSING_FILE_INPUT}` }],
        isError: true,
      };
    }

    try {
      const result = await this.service.embedImage(pageId, filename, fileContent, filePath, {
        alt,
        caption,
        width,
        align,
        position,
        headingText,
      });
      const embeddedFilename = result.attachment.results?.[0]?.title || filename || filePath?.split('/').pop() || 'image';
      return successResponse(
        `${ICONS.SUCCESS} Image "${embeddedFilename}" attached and embedded successfully!\n\n` +
        `**Attachment ID:** ${result.attachment.results?.[0]?.id}\n` +
        `**Page Version:** ${result.page.version}\n` +
        `**Position:** ${position || 'bottom'}\n` +
        (align ? `**Alignment:** ${align}\n` : '') +
        (width ? `**Width:** ${width}px\n` : '') +
        (caption ? `**Caption:** ${caption}` : '')
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to embed image in Confluence page',
        params: {
          'Page ID': pageId,
          [filePath ? 'File Path' : 'Filename']: filePath || filename,
          Position: position || 'bottom',
        },
        tip: 'Check if the page exists, you have edit permission, and the file path exists or content is properly base64 encoded.',
      });
    }
  }

  async getComments(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    try {
      const comments = await this.service.getComments(pageId);
      return jsonResponse(comments);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get comments',
        params: { 'Page ID': pageId },
        tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW,
      });
    }
  }

  async addComment(args: { pageId: string; body: string }): Promise<ToolResponse> {
    const { pageId, body } = args;
    try {
      const comment = await this.service.addComment(pageId, body);
      return successResponse(
        `${ICONS.SUCCESS} Comment added successfully!\n\n` +
        `**Comment ID:** ${comment.id}\n` +
        `**Author:** ${comment.author}\n` +
        `**Created:** ${comment.created}`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to add comment',
        params: { 'Page ID': pageId },
        tip: 'Check if the page exists and you have permission to comment on it.',
      });
    }
  }

  async updateComment(args: { commentId: string; body: string; version: number }): Promise<ToolResponse> {
    const { commentId, body, version } = args;
    try {
      const comment = await this.service.updateComment(commentId, body, version);
      return successResponse(
        `${ICONS.SUCCESS} Comment updated successfully!\n\n` +
        `**Comment ID:** ${comment.id}\n` +
        `**New Version:** ${comment.version}\n` +
        `**Updated:** ${comment.updated}`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to update comment',
        params: { 'Comment ID': commentId, Version: version },
        tip: 'Check if the comment exists, you have permission to edit it, and the version number is correct.',
      });
    }
  }

  async deleteComment(args: { commentId: string }): Promise<ToolResponse> {
    const { commentId } = args;
    try {
      await this.service.deleteComment(commentId);
      return successResponse(`${ICONS.SUCCESS} Comment ${commentId} deleted successfully`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to delete comment',
        params: { 'Comment ID': commentId },
        tip: 'Check if the comment exists and you have permission to delete it.',
      });
    }
  }

  async getPageChildren(args: { pageId: string; limit?: number }): Promise<ToolResponse> {
    const { pageId, limit } = args;
    try {
      const children = await this.service.getPageChildren(pageId, limit);
      return jsonResponse(children);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get child pages',
        params: { 'Page ID': pageId, Limit: limit || 25 },
        tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW,
      });
    }
  }

  async getLabels(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    try {
      const labels = await this.service.getLabels(pageId);
      return jsonResponse(labels);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get labels',
        params: { 'Page ID': pageId },
        tip: ERROR_TIPS.CONFLUENCE_LABEL,
      });
    }
  }

  async addLabels(args: { pageId: string; labels: string[] }): Promise<ToolResponse> {
    const { pageId, labels } = args;
    try {
      const result = await this.service.addLabels(pageId, labels);
      return successResponse(
        `${ICONS.SUCCESS} Labels added to page ${pageId}\n\n` +
        `${ICONS.LABELS} **Added:** ${labels.join(', ')}`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to add labels',
        params: { 'Page ID': pageId, Labels: labels.join(', ') },
        tip: ERROR_TIPS.CONFLUENCE_LABEL,
      });
    }
  }

  async removeLabel(args: { pageId: string; label: string }): Promise<ToolResponse> {
    const { pageId, label } = args;
    try {
      await this.service.removeLabel(pageId, label);
      return successResponse(`${ICONS.SUCCESS} Label "${label}" removed from page ${pageId}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to remove label',
        params: { 'Page ID': pageId, Label: label },
        tip: ERROR_TIPS.CONFLUENCE_LABEL,
      });
    }
  }

  async deletePage(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    try {
      await this.service.deletePage(pageId);
      return successResponse(`${ICONS.SUCCESS} Page ${pageId} deleted successfully`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to delete page',
        params: { 'Page ID': pageId },
        tip: ERROR_TIPS.CONFLUENCE_DELETE,
      });
    }
  }

  async getPageHistory(args: { pageId: string; limit?: number }): Promise<ToolResponse> {
    const { pageId, limit } = args;
    try {
      const history = await this.service.getPageHistory(pageId, limit);
      return jsonResponse(history);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get page history',
        params: { 'Page ID': pageId, Limit: limit || 25 },
        tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW,
      });
    }
  }
}
