import { PAGINATION, DEFAULTS } from '../constants.js';
import { ToolDefinition } from './confluence-tools.js';

/**
 * Jira tool definitions
 */
export const jiraTools: ToolDefinition[] = [
  {
    name: 'jira_search_issues',
    description: 'Search Jira issues by text query',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for in issues',
        },
        limit: {
          type: 'number',
          description: `Maximum number of results (default: ${PAGINATION.JIRA_DEFAULT_LIMIT})`,
          default: PAGINATION.JIRA_DEFAULT_LIMIT,
        },
      },
    },
  },
  {
    name: 'jira_get_issue',
    description: 'Get a specific Jira issue by key',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_create_issue',
    description: 'Create a new Jira issue with support for custom fields including due dates',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key where to create the issue',
        },
        summary: {
          type: 'string',
          description: 'Issue summary/title',
        },
        description: {
          type: 'string',
          description: 'Issue description',
        },
        issueType: {
          type: 'string',
          description: `Issue type (default: ${DEFAULTS.JIRA_ISSUE_TYPE})`,
          default: DEFAULTS.JIRA_ISSUE_TYPE,
        },
        duedate: {
          type: 'string',
          description: 'Due date in YYYY-MM-DD format (e.g., 2024-12-31)',
        },
        priority: {
          type: 'string',
          description: 'Priority name (e.g., High, Medium, Low)',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of label strings',
        },
        components: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of component names',
        },
        assignee: {
          type: 'string',
          description: 'Account ID of the assignee',
        },
        customFields: {
          type: 'object',
          description: 'Additional custom fields as key-value pairs',
        },
      },
      required: ['projectKey', 'summary', 'description'],
    },
  },
  {
    name: 'jira_update_issue',
    description: 'Update an existing Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to update',
        },
        summary: {
          type: 'string',
          description: 'New issue summary',
        },
        description: {
          type: 'string',
          description: 'New issue description',
        },
        assignee: {
          type: 'string',
          description: 'Account ID of the assignee',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_add_comment',
    description: 'Add a comment to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to comment on',
        },
        comment: {
          type: 'string',
          description: 'Comment text',
        },
      },
      required: ['issueKey', 'comment'],
    },
  },
  {
    name: 'jira_get_comments',
    description: 'Get all comments for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to get comments for',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_update_comment',
    description: 'Update an existing comment on a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
        commentId: {
          type: 'string',
          description: 'The comment ID to update',
        },
        comment: {
          type: 'string',
          description: 'New comment text',
        },
      },
      required: ['issueKey', 'commentId', 'comment'],
    },
  },
  {
    name: 'jira_delete_comment',
    description: 'Delete a comment from a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
        commentId: {
          type: 'string',
          description: 'The comment ID to delete',
        },
      },
      required: ['issueKey', 'commentId'],
    },
  },
  {
    name: 'jira_get_projects',
    description: 'Get list of Jira projects',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'jira_get_issue_transitions',
    description: 'Get available transitions for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJECT-123)',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_transition_issue',
    description: 'Transition a Jira issue to a different status with smart field handling',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to transition',
        },
        transitionId: {
          type: 'string',
          description: 'The transition ID',
        },
        fieldValues: {
          type: 'object',
          description: 'Optional field values for the transition',
        },
      },
      required: ['issueKey', 'transitionId'],
    },
  },
  {
    name: 'jira_transition_issue_interactive',
    description: 'Transition a Jira issue with automatic field suggestion and validation',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to transition',
        },
        transitionId: {
          type: 'string',
          description: 'The transition ID',
        },
        fieldValues: {
          type: 'object',
          description: 'Optional field values for the transition',
        },
      },
      required: ['issueKey', 'transitionId'],
    },
  },
  {
    name: 'jira_get_attachments',
    description: 'Get all attachments for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to get attachments for',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_add_attachment',
    description: 'Add an attachment to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to attach file to',
        },
        filename: {
          type: 'string',
          description: 'The filename for the attachment',
        },
        fileContent: {
          type: 'string',
          description: 'Base64 encoded file content',
        },
      },
      required: ['issueKey', 'filename', 'fileContent'],
    },
  },
  {
    name: 'jira_delete_attachment',
    description: 'Delete an attachment from a Jira issue',
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
    name: 'jira_get_issue_links',
    description: 'Get all issue links for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to get links for',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_create_issue_link',
    description: 'Create a link between two Jira issues',
    inputSchema: {
      type: 'object',
      properties: {
        inwardIssueKey: {
          type: 'string',
          description: 'The inward issue key',
        },
        outwardIssueKey: {
          type: 'string',
          description: 'The outward issue key',
        },
        linkType: {
          type: 'string',
          description: 'Link type name (e.g., "Blocks", "Relates", "Duplicates")',
        },
      },
      required: ['inwardIssueKey', 'outwardIssueKey', 'linkType'],
    },
  },
  {
    name: 'jira_delete_issue_link',
    description: 'Delete a link between Jira issues',
    inputSchema: {
      type: 'object',
      properties: {
        linkId: {
          type: 'string',
          description: 'The link ID to delete',
        },
      },
      required: ['linkId'],
    },
  },
  {
    name: 'jira_get_link_types',
    description: 'Get all available issue link types in Jira',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'jira_get_worklogs',
    description: 'Get all work logs (time tracking entries) for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to get work logs for',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_add_worklog',
    description: 'Add a work log (time spent) to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to log work on',
        },
        timeSpentSeconds: {
          type: 'number',
          description: 'Time spent in seconds (e.g., 3600 for 1 hour)',
        },
        comment: {
          type: 'string',
          description: 'Optional comment describing the work done',
        },
        started: {
          type: 'string',
          description: 'Optional start date/time in ISO 8601 format (e.g., 2024-01-15T14:30:00.000+0000)',
        },
      },
      required: ['issueKey', 'timeSpentSeconds'],
    },
  },
  {
    name: 'jira_update_worklog',
    description: 'Update an existing work log entry',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key',
        },
        worklogId: {
          type: 'string',
          description: 'The work log ID to update',
        },
        timeSpentSeconds: {
          type: 'number',
          description: 'Updated time spent in seconds',
        },
        comment: {
          type: 'string',
          description: 'Updated comment',
        },
      },
      required: ['issueKey', 'worklogId'],
    },
  },
  {
    name: 'jira_delete_worklog',
    description: 'Delete a work log entry from a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key',
        },
        worklogId: {
          type: 'string',
          description: 'The work log ID to delete',
        },
      },
      required: ['issueKey', 'worklogId'],
    },
  },
  {
    name: 'jira_get_watchers',
    description: 'Get all watchers for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to get watchers for',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_add_watcher',
    description: 'Add a watcher to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key',
        },
        accountId: {
          type: 'string',
          description: 'Account ID of the user to add as watcher',
        },
      },
      required: ['issueKey', 'accountId'],
    },
  },
  {
    name: 'jira_remove_watcher',
    description: 'Remove a watcher from a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key',
        },
        accountId: {
          type: 'string',
          description: 'Account ID of the user to remove as watcher',
        },
      },
      required: ['issueKey', 'accountId'],
    },
  },
  {
    name: 'jira_get_subtasks',
    description: 'Get all sub-tasks for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The parent issue key',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_create_subtask',
    description: 'Create a sub-task under a parent Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        parentKey: {
          type: 'string',
          description: 'The parent issue key',
        },
        summary: {
          type: 'string',
          description: 'Sub-task summary/title',
        },
        description: {
          type: 'string',
          description: 'Sub-task description',
        },
      },
      required: ['parentKey', 'summary', 'description'],
    },
  },
  {
    name: 'jira_get_issue_history',
    description: 'Get complete change history for a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to get history for',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_get_labels',
    description: 'Get available labels in Jira. Optionally filter by a search query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Optional text to filter labels (prefix match)',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of labels to return (default: 50)',
          default: 50,
        },
      },
    },
  },
  {
    name: 'jira_add_labels',
    description: 'Add labels to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of label strings to add',
        },
      },
      required: ['issueKey', 'labels'],
    },
  },
  {
    name: 'jira_remove_labels',
    description: 'Remove labels from a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of label strings to remove',
        },
      },
      required: ['issueKey', 'labels'],
    },
  },
];
