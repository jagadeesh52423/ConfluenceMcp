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
import { BaseHandler } from './base-handler.js';

/**
 * Confluence tool handlers
 */
export class ConfluenceHandlers extends BaseHandler {
  constructor(private service: ConfluenceService) { super(); }

  async searchPages(args: { query?: string; limit?: number }): Promise<ToolResponse> {
    const { query, limit } = args;
    return this.handle(
      () => this.service.searchPages({ query, limit }),
      { operation: 'Failed to search Confluence pages', params: { Query: query || 'none', Limit: limit || 25 }, tip: ERROR_TIPS.CONFLUENCE_SEARCH },
      jsonResponse
    );
  }

  async getPage(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    return this.handle(
      () => this.service.getPage(pageId),
      { operation: 'Failed to get Confluence page', params: { 'Page ID': pageId }, tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW },
      jsonResponse
    );
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
    return this.handle(
      () => this.service.createPageWithImages(spaceKey, title, content, parentId, images),
      {
        operation: 'Failed to create Confluence page',
        params: { 'Space Key': spaceKey, Title: title, 'Parent ID': parentId || 'none' },
        tip: ERROR_TIPS.CONFLUENCE_PAGE_CREATE + (images?.length ? ' For images, ensure they are properly base64 encoded.' : ''),
      },
      (page) => {
        const imageCount = images?.length || 0;
        const resultText = imageCount > 0
          ? `${ICONS.SUCCESS} Confluence page created successfully with ${imageCount} image(s)\n\n${JSON.stringify(page, null, 2)}`
          : JSON.stringify(page, null, 2);
        return successResponse(resultText);
      }
    );
  }

  async updatePage(args: {
    pageId: string;
    title: string;
    content: string;
    version: number;
  }): Promise<ToolResponse> {
    const { pageId, title, content, version } = args;
    return this.handle(
      () => this.service.updatePage(pageId, title, content, version),
      { operation: 'Failed to update Confluence page', params: { 'Page ID': pageId, Title: title, Version: version }, tip: ERROR_TIPS.CONFLUENCE_PAGE_EDIT },
      jsonResponse
    );
  }

  async getSpaces(args: { limit?: number }): Promise<ToolResponse> {
    const { limit } = args;
    return this.handle(
      () => this.service.getSpaces(limit),
      { operation: 'Failed to get Confluence spaces', params: { Limit: limit || 25 }, tip: ERROR_TIPS.CONFLUENCE_SPACE },
      jsonResponse
    );
  }

  async getPagesBySpace(args: { spaceKey: string; limit?: number }): Promise<ToolResponse> {
    const { spaceKey, limit } = args;
    return this.handle(
      () => this.service.getPagesBySpace(spaceKey, limit),
      { operation: 'Failed to get pages from Confluence space', params: { 'Space Key': spaceKey, Limit: limit || 25 }, tip: 'Check if the space key exists and you have permission to view it.' },
      jsonResponse
    );
  }

  async getAttachments(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    return this.handle(
      () => this.service.getAttachments(pageId),
      { operation: 'Failed to get attachments for Confluence page', params: { 'Page ID': pageId }, tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW },
      jsonResponse
    );
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

    return this.handle(
      () => this.service.addAttachment(pageId, filename, fileContent, filePath),
      {
        operation: 'Failed to add attachment to Confluence page',
        params: { 'Page ID': pageId, [filePath ? 'File Path' : 'Filename']: filePath || filename },
        tip: ERROR_TIPS.CONFLUENCE_ATTACHMENT,
      },
      (result) => {
        const attachedFilename = result.results?.[0]?.title || filename || filePath?.split('/').pop() || 'attachment';
        return successResponse(
          `${ICONS.SUCCESS} Attachment "${attachedFilename}" added successfully to page ${pageId}\n\n${JSON.stringify(result, null, 2)}`
        );
      }
    );
  }

  async deleteAttachment(args: { attachmentId: string }): Promise<ToolResponse> {
    const { attachmentId } = args;
    return this.handle(
      () => this.service.deleteAttachment(attachmentId),
      { operation: 'Failed to delete attachment', params: { 'Attachment ID': attachmentId }, tip: 'Check if the attachment exists and you have permission to delete it.' },
      () => successResponse(`${ICONS.SUCCESS} Attachment ${attachmentId} deleted successfully`)
    );
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

    return this.handle(
      () => this.service.embedImage(pageId, filename, fileContent, filePath, { alt, caption, width, align, position, headingText }),
      {
        operation: 'Failed to embed image in Confluence page',
        params: { 'Page ID': pageId, [filePath ? 'File Path' : 'Filename']: filePath || filename, Position: position || 'bottom' },
        tip: 'Check if the page exists, you have edit permission, and the file path exists or content is properly base64 encoded.',
      },
      (result) => {
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
      }
    );
  }

  async getComments(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    return this.handle(
      () => this.service.getComments(pageId),
      { operation: 'Failed to get comments', params: { 'Page ID': pageId }, tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW },
      jsonResponse
    );
  }

  async addComment(args: { pageId: string; body: string }): Promise<ToolResponse> {
    const { pageId, body } = args;
    return this.handle(
      () => this.service.addComment(pageId, body),
      { operation: 'Failed to add comment', params: { 'Page ID': pageId }, tip: 'Check if the page exists and you have permission to comment on it.' },
      (comment) => successResponse(
        `${ICONS.SUCCESS} Comment added successfully!\n\n` +
        `**Comment ID:** ${comment.id}\n` +
        `**Author:** ${comment.author}\n` +
        `**Created:** ${comment.created}`
      )
    );
  }

  async updateComment(args: { commentId: string; body: string; version: number }): Promise<ToolResponse> {
    const { commentId, body, version } = args;
    return this.handle(
      () => this.service.updateComment(commentId, body, version),
      { operation: 'Failed to update comment', params: { 'Comment ID': commentId, Version: version }, tip: 'Check if the comment exists, you have permission to edit it, and the version number is correct.' },
      (comment) => successResponse(
        `${ICONS.SUCCESS} Comment updated successfully!\n\n` +
        `**Comment ID:** ${comment.id}\n` +
        `**New Version:** ${comment.version}\n` +
        `**Updated:** ${comment.updated}`
      )
    );
  }

  async deleteComment(args: { commentId: string }): Promise<ToolResponse> {
    const { commentId } = args;
    return this.handle(
      () => this.service.deleteComment(commentId),
      { operation: 'Failed to delete comment', params: { 'Comment ID': commentId }, tip: 'Check if the comment exists and you have permission to delete it.' },
      () => successResponse(`${ICONS.SUCCESS} Comment ${commentId} deleted successfully`)
    );
  }

  async getPageChildren(args: { pageId: string; limit?: number }): Promise<ToolResponse> {
    const { pageId, limit } = args;
    return this.handle(
      () => this.service.getPageChildren(pageId, limit),
      { operation: 'Failed to get child pages', params: { 'Page ID': pageId, Limit: limit || 25 }, tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW },
      jsonResponse
    );
  }

  async getLabels(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    return this.handle(
      () => this.service.getLabels(pageId),
      { operation: 'Failed to get labels', params: { 'Page ID': pageId }, tip: ERROR_TIPS.CONFLUENCE_LABEL },
      jsonResponse
    );
  }

  async addLabels(args: { pageId: string; labels: string[] }): Promise<ToolResponse> {
    const { pageId, labels } = args;
    return this.handle(
      () => this.service.addLabels(pageId, labels),
      { operation: 'Failed to add labels', params: { 'Page ID': pageId, Labels: labels.join(', ') }, tip: ERROR_TIPS.CONFLUENCE_LABEL },
      () => successResponse(
        `${ICONS.SUCCESS} Labels added to page ${pageId}\n\n` +
        `${ICONS.LABELS} **Added:** ${labels.join(', ')}`
      )
    );
  }

  async removeLabel(args: { pageId: string; label: string }): Promise<ToolResponse> {
    const { pageId, label } = args;
    return this.handle(
      () => this.service.removeLabel(pageId, label),
      { operation: 'Failed to remove label', params: { 'Page ID': pageId, Label: label }, tip: ERROR_TIPS.CONFLUENCE_LABEL },
      () => successResponse(`${ICONS.SUCCESS} Label "${label}" removed from page ${pageId}`)
    );
  }

  async deletePage(args: { pageId: string }): Promise<ToolResponse> {
    const { pageId } = args;
    return this.handle(
      () => this.service.deletePage(pageId),
      { operation: 'Failed to delete page', params: { 'Page ID': pageId }, tip: ERROR_TIPS.CONFLUENCE_DELETE },
      () => successResponse(`${ICONS.SUCCESS} Page ${pageId} deleted successfully`)
    );
  }

  async getPageHistory(args: { pageId: string; limit?: number }): Promise<ToolResponse> {
    const { pageId, limit } = args;
    return this.handle(
      () => this.service.getPageHistory(pageId, limit),
      { operation: 'Failed to get page history', params: { 'Page ID': pageId, Limit: limit || 25 }, tip: ERROR_TIPS.CONFLUENCE_PAGE_VIEW },
      jsonResponse
    );
  }
}
