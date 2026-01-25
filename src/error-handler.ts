import { ICONS } from './constants.js';

/**
 * Standard MCP tool response type
 */
export interface ToolResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

/**
 * Error context for building informative error messages
 */
export interface ErrorContext {
  operation: string;
  params?: Record<string, any>;
  tip?: string;
}

/**
 * Creates a successful response with text content
 */
export function successResponse(text: string): ToolResponse {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Creates a successful response with JSON content
 */
export function jsonResponse(data: any): ToolResponse {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Creates an error response with detailed information
 */
export function errorResponse(error: any, context: ErrorContext): ToolResponse {
  const errorDetails = error.response?.data || error.message;
  const paramsText = context.params
    ? Object.entries(context.params)
        .map(([key, value]) => `- ${key}: ${value ?? 'none'}`)
        .join('\n')
    : '';

  let text = `${ICONS.ERROR} ${context.operation}\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}`;

  if (paramsText) {
    text += `\n\n**Request:**\n${paramsText}`;
  }

  if (context.tip) {
    text += `\n\n**Tip:** ${context.tip}`;
  }

  return {
    content: [{ type: 'text', text }],
    isError: true,
  };
}

/**
 * Wraps an async operation with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  formatResult: (result: T) => ToolResponse
): Promise<ToolResponse> {
  try {
    const result = await operation();
    return formatResult(result);
  } catch (error: any) {
    return errorResponse(error, context);
  }
}

/**
 * Common error tips for different scenarios
 */
export const ERROR_TIPS = {
  // Confluence
  CONFLUENCE_SEARCH: 'Check your Confluence permissions and that the domain is accessible.',
  CONFLUENCE_PAGE_VIEW: 'Check if the page ID exists and you have permission to view it.',
  CONFLUENCE_PAGE_CREATE: 'Check if the space exists and you have permission to create pages in it.',
  CONFLUENCE_PAGE_EDIT: 'Check if the page exists, version is correct, and you have permission to edit it.',
  CONFLUENCE_SPACE: 'Check your Confluence permissions and API access.',
  CONFLUENCE_ATTACHMENT: 'Check if the page exists and you have permission to attach files.',
  CONFLUENCE_COMMENT: 'Check if the page/comment exists and you have the appropriate permissions.',

  // Jira
  JIRA_SEARCH: 'Check your JQL syntax and Jira permissions.',
  JIRA_ISSUE_VIEW: 'Check if the issue key exists and you have permission to view it.',
  JIRA_ISSUE_CREATE: 'Check if all required fields are provided and project exists.',
  JIRA_ISSUE_EDIT: 'Check if the issue exists and you have permission to update it.',
  JIRA_COMMENT: 'Check if the issue/comment exists and you have the appropriate permissions.',
  JIRA_TRANSITION: 'Check if the transition ID is valid for this issue and you have permission to transition it.',
  JIRA_ATTACHMENT: 'Check if the issue exists and file content is properly base64 encoded.',
  JIRA_LINK: 'Check if both issues exist and the link type is valid. Use jira_get_link_types to see available link types.',
  JIRA_WORKLOG: 'Check if the issue/worklog exists and you have permission.',
  JIRA_WATCHER: 'Check if the issue and user exist, and you have permission.',
  JIRA_SUBTASK: 'Check if the parent issue exists, the project allows sub-tasks, and you have permission to create issues.',

  // Bitbucket
  BITBUCKET_REPO: 'Check your Bitbucket permissions and API access.',
  BITBUCKET_REPO_VIEW: 'Check if the repository exists and you have access to it.',
} as const;

/**
 * Format helpers for common response patterns
 */
export const formatHelpers = {
  /**
   * Format a success message with optional details
   */
  success(message: string, details?: Record<string, any>): string {
    let text = `${ICONS.SUCCESS} ${message}`;
    if (details) {
      text += '\n\n' + Object.entries(details)
        .map(([key, value]) => `**${key}:** ${value}`)
        .join('\n');
    }
    return text;
  },

  /**
   * Format an issue creation success message
   */
  issueCreated(issue: any, optionalFields?: Record<string, any>): string {
    const domain = process.env.JIRA_DOMAIN || process.env.ATLASSIAN_DOMAIN || 'your-domain.atlassian.net';
    let text = `${ICONS.SUCCESS} **Jira Issue Created Successfully**

${ICONS.TICKET} **Issue Key:** ${issue.key}
${ICONS.SUMMARY} **Summary:** ${issue.summary}
${ICONS.STATUS} **Status:** ${issue.status}
${ICONS.DATE} **Created:** ${new Date(issue.created).toLocaleString()}`;

    if (optionalFields) {
      const fieldLines = Object.entries(optionalFields)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`);
      if (fieldLines.length > 0) {
        text += '\n\n' + fieldLines.join('\n');
      }
    }

    text += `\n\n${ICONS.LINK} **Issue URL:** [View Issue](https://${domain}/browse/${issue.key})`;
    return text;
  },

  /**
   * Format an issue update success message
   */
  issueUpdated(issue: any, updatedFields: string[]): string {
    const domain = process.env.JIRA_DOMAIN || process.env.ATLASSIAN_DOMAIN || 'your-domain.atlassian.net';
    let text = `${ICONS.SUCCESS} **Jira Issue Updated Successfully**

${ICONS.TICKET} **Issue Key:** ${issue.key}
${ICONS.STATUS} **Current Status:** ${issue.status}
${ICONS.DATE} **Last Updated:** ${new Date(issue.updated).toLocaleString()}`;

    if (updatedFields.length > 0) {
      text += `\n\n**Updated Fields:**\n${updatedFields.join('\n')}`;
    }

    text += `\n\n${ICONS.LINK} **Issue URL:** [View Issue](https://${domain}/browse/${issue.key})`;
    return text;
  },
};
