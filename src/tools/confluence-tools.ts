import { PAGINATION } from '../constants.js';

/**
 * Tool definition interface matching MCP SDK requirements
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Confluence tool definitions
 */
export const confluenceTools: ToolDefinition[] = [
  {
    name: 'confluence_search_pages',
    description: 'Search Confluence pages by text query',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for in pages',
        },
        limit: {
          type: 'number',
          description: `Maximum number of results (default: ${PAGINATION.CONFLUENCE_DEFAULT_LIMIT})`,
          default: PAGINATION.CONFLUENCE_DEFAULT_LIMIT,
        },
      },
    },
  },
  {
    name: 'confluence_get_page',
    description: 'Get a specific Confluence page by ID',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to retrieve',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_create_page',
    description: 'Create a new Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        spaceKey: {
          type: 'string',
          description: 'The space key where to create the page',
        },
        title: {
          type: 'string',
          description: 'Page title',
        },
        content: {
          type: 'string',
          description: 'Page content in Confluence storage format',
        },
        parentId: {
          type: 'string',
          description: 'Optional parent page ID',
        },
        images: {
          type: 'array',
          description: 'Optional array of images to upload and embed. Use {{IMAGE:filename}} placeholders in content to position images inline, or they will be appended at the end. Provide either filePath or fileContent for each image.',
          items: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Local file path (e.g., "/path/to/image.png"). Filename is auto-detected. Use {{IMAGE:image.png}} in content.',
              },
              filename: {
                type: 'string',
                description: 'Image filename (optional if filePath provided). Use {{IMAGE:filename}} in content to position it.',
              },
              fileContent: {
                type: 'string',
                description: 'Base64 encoded image content (alternative to filePath)',
              },
              alt: {
                type: 'string',
                description: 'Optional alt text for the image',
              },
              caption: {
                type: 'string',
                description: 'Optional caption to display below the image',
              },
              width: {
                type: 'number',
                description: 'Optional width in pixels',
              },
              align: {
                type: 'string',
                enum: ['left', 'center', 'right'],
                description: 'Optional alignment',
              },
            },
            required: [],
          },
        },
      },
      required: ['spaceKey', 'title', 'content'],
    },
  },
  {
    name: 'confluence_update_page',
    description: 'Update an existing Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to update',
        },
        title: {
          type: 'string',
          description: 'New page title',
        },
        content: {
          type: 'string',
          description: 'New page content in Confluence storage format',
        },
        version: {
          type: 'number',
          description: 'Current version number of the page',
        },
      },
      required: ['pageId', 'title', 'content', 'version'],
    },
  },
  {
    name: 'confluence_get_spaces',
    description: 'Get list of Confluence spaces',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: `Maximum number of spaces to return (default: ${PAGINATION.CONFLUENCE_DEFAULT_LIMIT})`,
          default: PAGINATION.CONFLUENCE_DEFAULT_LIMIT,
        },
      },
    },
  },
  {
    name: 'confluence_get_pages_by_space',
    description: 'Get pages from a specific Confluence space',
    inputSchema: {
      type: 'object',
      properties: {
        spaceKey: {
          type: 'string',
          description: 'The space key to get pages from',
        },
        limit: {
          type: 'number',
          description: `Maximum number of pages to return (default: ${PAGINATION.CONFLUENCE_DEFAULT_LIMIT})`,
          default: PAGINATION.CONFLUENCE_DEFAULT_LIMIT,
        },
      },
      required: ['spaceKey'],
    },
  },
  {
    name: 'confluence_get_attachments',
    description: 'Get all attachments for a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to get attachments for',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_add_attachment',
    description: 'Add an attachment to a Confluence page. Provide either filePath (local file) or fileContent (base64).',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to attach file to',
        },
        filePath: {
          type: 'string',
          description: 'Local file path to attach (e.g., "/path/to/file.svg"). If provided, filename is auto-detected.',
        },
        filename: {
          type: 'string',
          description: 'The filename for the attachment (optional if filePath is provided)',
        },
        fileContent: {
          type: 'string',
          description: 'Base64 encoded file content (alternative to filePath)',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_delete_attachment',
    description: 'Delete an attachment from a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        attachmentId: {
          type: 'string',
          description: 'The attachment ID to delete',
        },
      },
      required: ['attachmentId'],
    },
  },
  {
    name: 'confluence_embed_image',
    description: 'Attach an image to a Confluence page and embed it in the content. Provide either filePath (local file) or fileContent (base64).',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to embed the image in',
        },
        filePath: {
          type: 'string',
          description: 'Local file path to the image (e.g., "/path/to/diagram.svg"). If provided, filename is auto-detected.',
        },
        filename: {
          type: 'string',
          description: 'The filename for the image (optional if filePath is provided)',
        },
        fileContent: {
          type: 'string',
          description: 'Base64 encoded image content (alternative to filePath)',
        },
        alt: {
          type: 'string',
          description: 'Alt text for the image (defaults to filename)',
        },
        caption: {
          type: 'string',
          description: 'Optional caption to display below the image',
        },
        width: {
          type: 'number',
          description: 'Optional width in pixels for the image',
        },
        align: {
          type: 'string',
          enum: ['left', 'center', 'right'],
          description: 'Image alignment (default: no alignment)',
        },
        position: {
          type: 'string',
          enum: ['top', 'bottom', 'after-heading'],
          description: 'Where to insert the image (default: bottom)',
        },
        headingText: {
          type: 'string',
          description: 'If position is "after-heading", the heading text to insert after',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_get_comments',
    description: 'Get all comments for a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to get comments for',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_add_comment',
    description: 'Add a comment to a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to add comment to',
        },
        body: {
          type: 'string',
          description: 'Comment content in Confluence storage format (HTML)',
        },
      },
      required: ['pageId', 'body'],
    },
  },
  {
    name: 'confluence_update_comment',
    description: 'Update an existing comment on a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: {
          type: 'string',
          description: 'The comment ID to update',
        },
        body: {
          type: 'string',
          description: 'New comment content in Confluence storage format (HTML)',
        },
        version: {
          type: 'number',
          description: 'Current version number of the comment',
        },
      },
      required: ['commentId', 'body', 'version'],
    },
  },
  {
    name: 'confluence_delete_comment',
    description: 'Delete a comment from a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: {
          type: 'string',
          description: 'The comment ID to delete',
        },
      },
      required: ['commentId'],
    },
  },
  {
    name: 'confluence_get_page_children',
    description: 'Get child pages of a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The parent page ID',
        },
        limit: {
          type: 'number',
          description: `Maximum number of child pages to return (default: ${PAGINATION.CONFLUENCE_DEFAULT_LIMIT})`,
          default: PAGINATION.CONFLUENCE_DEFAULT_LIMIT,
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_get_labels',
    description: 'Get all labels on a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to get labels for',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_add_labels',
    description: 'Add labels to a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to add labels to',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of label names to add',
        },
      },
      required: ['pageId', 'labels'],
    },
  },
  {
    name: 'confluence_remove_label',
    description: 'Remove a label from a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to remove the label from',
        },
        label: {
          type: 'string',
          description: 'The label name to remove',
        },
      },
      required: ['pageId', 'label'],
    },
  },
  {
    name: 'confluence_delete_page',
    description: 'Delete a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to delete',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_get_page_history',
    description: 'Get version history for a Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to get history for',
        },
        limit: {
          type: 'number',
          description: `Maximum number of versions to return (default: ${PAGINATION.CONFLUENCE_DEFAULT_LIMIT})`,
          default: PAGINATION.CONFLUENCE_DEFAULT_LIMIT,
        },
      },
      required: ['pageId'],
    },
  },
];
