import { PAGINATION, DEFAULTS } from '../constants.js';
import { ToolDefinition } from './confluence-tools.js';

/**
 * Jira tool definitions
 */
export const jiraTools: ToolDefinition[] = [
  {
    name: 'jira_search_issues',
    description: 'Search Jira issues with flexible filtering. Use individual filters (assignee, status, project, labels) or provide raw JQL for advanced queries.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Text to search for in issues',
        },
        assignee: {
          type: 'string',
          description: 'Filter by assignee. Use "currentUser()" for your own issues, or an account ID',
        },
        status: {
          type: 'string',
          description: 'Filter by status name (e.g., "To Do", "In Progress", "Done")',
        },
        project: {
          type: 'string',
          description: 'Filter by project key (e.g., "PROJ")',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by labels (all must match)',
        },
        reporter: {
          type: 'string',
          description: 'Filter by reporter. Use "currentUser()" for issues you reported, or an account ID',
        },
        createdAfter: {
          type: 'string',
          description: 'Show issues created after this date. Use relative days (e.g., "10d" for last 10 days, "30d" for last 30 days) or absolute date (e.g., "2026-01-15")',
        },
        updatedAfter: {
          type: 'string',
          description: 'Show issues updated after this date. Use relative days (e.g., "7d" for last 7 days) or absolute date (e.g., "2026-01-15")',
        },
        jql: {
          type: 'string',
          description: 'Raw JQL query (overrides all other filters when provided)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields to include in the response. When specified, ONLY these fields are returned (plus issue key). When omitted, defaults to: summary, description, status, assignee, labels, created, updated. Use jira_get_fields to discover all available field IDs before using this parameter.',
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
    description: 'Get a specific Jira issue by key. Optionally specify which fields to return.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields to include in the response. When specified, ONLY these fields are returned (plus issue id and key). When omitted, defaults to: summary, description, status, assignee, labels, created, updated. Use jira_get_fields to discover all available field IDs.',
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
    name: 'jira_get_fields',
    description: 'Get available fields in Jira. Use this to discover field IDs for use with jira_search_issues fields parameter.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['standard', 'custom', 'all'],
          description: 'Filter by field type: "standard" for built-in fields, "custom" for custom fields, "all" for both (default: "all")',
        },
      },
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
  {
    name: 'jira_get_agile_boards',
    description: 'Get Jira agile boards. Optionally filter by name, type (scrum/kanban), or project.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Filter boards by name (contains match)',
        },
        type: {
          type: 'string',
          enum: ['scrum', 'kanban', 'simple'],
          description: 'Filter by board type',
        },
        projectKeyOrId: {
          type: 'string',
          description: 'Filter boards by project key or ID',
        },
      },
    },
  },
  {
    name: 'jira_get_board_issues',
    description: 'Get all issues on a Jira agile board',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'number',
          description: 'The board ID',
        },
        jql: {
          type: 'string',
          description: 'Optional JQL to filter issues on the board',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
          default: 50,
        },
        startAt: {
          type: 'number',
          description: 'Index of the first result (default: 0)',
          default: 0,
        },
      },
      required: ['boardId'],
    },
  },
  {
    name: 'jira_get_sprints',
    description: 'Get sprints for a Jira agile board',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'number',
          description: 'The board ID',
        },
        state: {
          type: 'string',
          enum: ['active', 'closed', 'future'],
          description: 'Filter sprints by state',
        },
      },
      required: ['boardId'],
    },
  },
  {
    name: 'jira_get_sprint_issues',
    description: 'Get all issues in a specific sprint',
    inputSchema: {
      type: 'object',
      properties: {
        sprintId: {
          type: 'number',
          description: 'The sprint ID',
        },
        jql: {
          type: 'string',
          description: 'Optional JQL to filter issues in the sprint',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 50)',
          default: 50,
        },
        startAt: {
          type: 'number',
          description: 'Index of the first result (default: 0)',
          default: 0,
        },
      },
      required: ['sprintId'],
    },
  },
  {
    name: 'jira_batch_create_issues',
    description: 'Create multiple Jira issues in a single request (max 50)',
    inputSchema: {
      type: 'object',
      properties: {
        issues: {
          type: 'array',
          description: 'Array of issues to create (max 50)',
          items: {
            type: 'object',
            properties: {
              projectKey: {
                type: 'string',
                description: 'The project key',
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
                description: 'Issue type (default: Task)',
              },
              additionalFields: {
                type: 'object',
                description: 'Additional fields as key-value pairs',
              },
            },
            required: ['projectKey', 'summary', 'description'],
          },
        },
      },
      required: ['issues'],
    },
  },
  {
    name: 'jira_get_dev_status',
    description: 'Get development information (PRs, branches, commits) linked to a Jira issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueId: {
          type: 'string',
          description: 'The numeric issue ID (not the key). Use jira_get_issue to get the ID.',
        },
        applicationType: {
          type: 'string',
          description: 'Filter by application type (e.g., "GitHub", "Bitbucket", "GitLab")',
        },
        dataType: {
          type: 'string',
          description: 'Filter by data type (e.g., "pullrequest", "branch", "repository")',
        },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'jira_delete_issue',
    description: 'Delete a Jira issue. Optionally delete its subtasks.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to delete (e.g., PROJ-123)',
        },
        deleteSubtasks: {
          type: 'boolean',
          description: 'Whether to also delete subtasks (default: false)',
          default: false,
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_lookup_user',
    description: 'Look up Jira users by name or email address. Returns account IDs needed for assignee, watcher, and other user fields.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Name or email address to search for',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'jira_get_issue_types',
    description: 'Get available issue types for a Jira project (e.g., Bug, Story, Task, Epic, Sub-task)',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ)',
        },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'jira_create_sprint',
    description: 'Create a new sprint on a Jira agile board',
    inputSchema: {
      type: 'object',
      properties: {
        boardId: {
          type: 'number',
          description: 'The board ID to create the sprint on',
        },
        name: {
          type: 'string',
          description: 'Sprint name',
        },
        startDate: {
          type: 'string',
          description: 'Sprint start date in ISO 8601 format (e.g., 2026-03-01T00:00:00.000Z)',
        },
        endDate: {
          type: 'string',
          description: 'Sprint end date in ISO 8601 format',
        },
        goal: {
          type: 'string',
          description: 'Sprint goal description',
        },
      },
      required: ['boardId', 'name'],
    },
  },
  {
    name: 'jira_update_sprint',
    description: 'Update an existing sprint (name, dates, state, goal)',
    inputSchema: {
      type: 'object',
      properties: {
        sprintId: {
          type: 'number',
          description: 'The sprint ID to update',
        },
        name: {
          type: 'string',
          description: 'New sprint name',
        },
        state: {
          type: 'string',
          enum: ['active', 'closed', 'future'],
          description: 'New sprint state (use to start or close a sprint)',
        },
        startDate: {
          type: 'string',
          description: 'New start date in ISO 8601 format',
        },
        endDate: {
          type: 'string',
          description: 'New end date in ISO 8601 format',
        },
        goal: {
          type: 'string',
          description: 'Updated sprint goal',
        },
      },
      required: ['sprintId'],
    },
  },
  {
    name: 'jira_get_project_versions',
    description: 'Get all versions (releases) for a Jira project',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ)',
        },
      },
      required: ['projectKey'],
    },
  },
  {
    name: 'jira_create_version',
    description: 'Create a new version (release) in a Jira project',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ)',
        },
        name: {
          type: 'string',
          description: 'Version name (e.g., "1.2.0")',
        },
        description: {
          type: 'string',
          description: 'Version description',
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        releaseDate: {
          type: 'string',
          description: 'Release date in YYYY-MM-DD format',
        },
        released: {
          type: 'boolean',
          description: 'Whether the version is released (default: false)',
          default: false,
        },
      },
      required: ['projectKey', 'name'],
    },
  },
  {
    name: 'jira_update_version',
    description: 'Update an existing version (release) in Jira',
    inputSchema: {
      type: 'object',
      properties: {
        versionId: {
          type: 'string',
          description: 'The version ID to update',
        },
        name: {
          type: 'string',
          description: 'New version name',
        },
        description: {
          type: 'string',
          description: 'New version description',
        },
        startDate: {
          type: 'string',
          description: 'New start date in YYYY-MM-DD format',
        },
        releaseDate: {
          type: 'string',
          description: 'New release date in YYYY-MM-DD format',
        },
        released: {
          type: 'boolean',
          description: 'Mark as released',
        },
        archived: {
          type: 'boolean',
          description: 'Mark as archived',
        },
      },
      required: ['versionId'],
    },
  },
  {
    name: 'jira_link_to_epic',
    description: 'Link an issue to an epic. Works with both next-gen (parent field) and classic (Epic Link field) projects.',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key to link (e.g., PROJ-456)',
        },
        epicKey: {
          type: 'string',
          description: 'The epic key to link to (e.g., PROJ-100)',
        },
      },
      required: ['issueKey', 'epicKey'],
    },
  },
];
