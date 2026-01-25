/**
 * Application-wide constants
 * Centralizes all magic numbers and hardcoded values for easy maintenance
 */

// Pagination defaults
export const PAGINATION = {
  CONFLUENCE_DEFAULT_LIMIT: 25,
  JIRA_DEFAULT_LIMIT: 50,
  BITBUCKET_DEFAULT_LIMIT: 10,
  USER_SEARCH_LIMIT: 10,
} as const;

// Default values
export const DEFAULTS = {
  BRANCH_NAME: 'main',
  JIRA_ISSUE_TYPE: 'Task',
  JIRA_DATE_FILTER: '-90d',
  BITBUCKET_ISSUE_KIND: 'bug',
  BITBUCKET_ISSUE_PRIORITY: 'major',
  BITBUCKET_PR_STATE: 'OPEN',
  BITBUCKET_ISSUE_STATE: 'open',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Confluence
  CONFLUENCE_CONTENT: '/wiki/rest/api/content',
  CONFLUENCE_CONTENT_SEARCH: '/wiki/rest/api/content/search',
  CONFLUENCE_SPACE: '/wiki/rest/api/space',

  // Jira
  JIRA_SEARCH: '/rest/api/3/search/jql',
  JIRA_ISSUE: '/rest/api/3/issue',
  JIRA_PROJECT: '/rest/api/3/project',
  JIRA_USER_SEARCH: '/rest/api/3/user/search',
  JIRA_ISSUE_LINK: '/rest/api/3/issueLink',
  JIRA_ISSUE_LINK_TYPE: '/rest/api/3/issueLinkType',
  JIRA_ATTACHMENT: '/rest/api/3/attachment',

  // Bitbucket
  BITBUCKET_BASE_URL: 'https://api.bitbucket.org/2.0',
} as const;

// Confluence expand options
export const CONFLUENCE_EXPAND = {
  PAGE_DEFAULT: ['body.storage', 'version', 'space'],
  COMMENT_DEFAULT: ['body.storage', 'version', 'history'],
} as const;

// Jira field defaults
export const JIRA_FIELDS = {
  SEARCH_FIELDS: 'summary,description,status,assignee,created,updated',
  ISSUE_FIELDS: ['summary', 'description', 'status', 'assignee', 'created', 'updated'],
} as const;

// Service names for logging
export const SERVICE_NAMES = {
  CONFLUENCE: 'Confluence',
  JIRA: 'Jira',
  BITBUCKET: 'Bitbucket',
  ATLASSIAN: 'Atlassian',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  MISSING_FILE_INPUT: 'Either filePath or fileContent must be provided',
  FILE_NOT_FOUND: (path: string) => `File not found: ${path}`,
  UNKNOWN_TOOL: (name: string) => `Unknown tool: ${name}`,
} as const;

// Success icons for formatted responses
export const ICONS = {
  SUCCESS: '✅',
  ERROR: '❌',
  SUGGESTION: '💡',
  TICKET: '🎫',
  SUMMARY: '📝',
  STATUS: '📊',
  DATE: '📅',
  DESCRIPTION: '📄',
  LINK: '🔗',
  PRIORITY: '🔥',
  LABELS: '🏷️',
  COMPONENTS: '🧩',
  ASSIGNEE: '👤',
} as const;
