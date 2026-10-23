import { PAGINATION, DEFAULTS } from '../constants.js';
import { ToolDefinition } from './confluence-tools.js';

/**
 * Bitbucket tool definitions
 */
export const bitbucketTools: ToolDefinition[] = [
  {
    name: 'bitbucket_get_repositories',
    description: 'Get list of Bitbucket repositories in workspace',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for repository names',
        },
        limit: {
          type: 'number',
          description: `Maximum number of repositories (default: ${PAGINATION.BITBUCKET_DEFAULT_LIMIT})`,
          default: PAGINATION.BITBUCKET_DEFAULT_LIMIT,
        },
      },
    },
  },
  {
    name: 'bitbucket_get_repository',
    description: 'Get details of a specific Bitbucket repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
      },
      required: ['repoName'],
    },
  },
  {
    name: 'bitbucket_create_repository',
    description: 'Create a new Bitbucket repository',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Repository name',
        },
        description: {
          type: 'string',
          description: 'Repository description',
        },
        isPrivate: {
          type: 'boolean',
          description: 'Whether the repository should be private (default: true)',
          default: true,
        },
        language: {
          type: 'string',
          description: 'Primary programming language',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'bitbucket_get_pull_requests',
    description: 'Get pull requests for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        state: {
          type: 'string',
          description: `Pull request state (OPEN, MERGED, DECLINED) (default: ${DEFAULTS.BITBUCKET_PR_STATE})`,
          default: DEFAULTS.BITBUCKET_PR_STATE,
        },
        limit: {
          type: 'number',
          description: `Maximum number of pull requests (default: ${PAGINATION.BITBUCKET_DEFAULT_LIMIT})`,
          default: PAGINATION.BITBUCKET_DEFAULT_LIMIT,
        },
      },
      required: ['repoName'],
    },
  },
  {
    name: 'bitbucket_get_pull_request',
    description: 'Get details of a specific pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        includeDiff: {
          type: 'boolean',
          description: 'Whether to include the code diff/changes (default: false)',
          default: false,
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_create_pull_request',
    description: 'Create a new pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        title: {
          type: 'string',
          description: 'Pull request title',
        },
        sourceBranch: {
          type: 'string',
          description: 'Source branch name',
        },
        destinationBranch: {
          type: 'string',
          description: `Destination branch name (default: ${DEFAULTS.BRANCH_NAME})`,
          default: DEFAULTS.BRANCH_NAME,
        },
        description: {
          type: 'string',
          description: 'Pull request description',
        },
        draft: {
          type: 'boolean',
          description: 'Create the PR as a draft (default: false)',
        },
        reviewers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Reviewers: account IDs, or UUIDs wrapped in braces, e.g. {1234-...}',
        },
        closeSourceBranch: {
          type: 'boolean',
          description: 'Close the source branch when the PR is merged (default: false)',
        },
      },
      required: ['repoName', 'title', 'sourceBranch'],
    },
  },
  {
    name: 'bitbucket_update_pull_request',
    description: 'Update an existing pull request (title, description, destination branch, draft state, or reviewers). At least one of title, description, destinationBranch, draft, or reviewers must be provided.',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        title: {
          type: 'string',
          description: 'New pull request title',
        },
        description: {
          type: 'string',
          description: 'New pull request description',
        },
        destinationBranch: {
          type: 'string',
          description: 'New destination branch name',
        },
        draft: {
          type: 'boolean',
          description: 'Set draft state; false marks a draft PR ready for review',
        },
        reviewers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Reviewers (account IDs, or UUIDs wrapped in braces). REPLACES the entire reviewer list; pass [] to clear',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_get_branches',
    description: 'Get branches for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        limit: {
          type: 'number',
          description: `Maximum number of branches (default: ${PAGINATION.BITBUCKET_DEFAULT_LIMIT})`,
          default: PAGINATION.BITBUCKET_DEFAULT_LIMIT,
        },
      },
      required: ['repoName'],
    },
  },
  {
    name: 'bitbucket_get_commits',
    description: 'Get commits for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        branch: {
          type: 'string',
          description: `Branch name (default: ${DEFAULTS.BRANCH_NAME})`,
          default: DEFAULTS.BRANCH_NAME,
        },
        limit: {
          type: 'number',
          description: `Maximum number of commits (default: ${PAGINATION.BITBUCKET_DEFAULT_LIMIT})`,
          default: PAGINATION.BITBUCKET_DEFAULT_LIMIT,
        },
      },
      required: ['repoName'],
    },
  },
  {
    name: 'bitbucket_get_issues',
    description: 'Get issues for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        state: {
          type: 'string',
          description: `Issue state (open, closed) (default: ${DEFAULTS.BITBUCKET_ISSUE_STATE})`,
          default: DEFAULTS.BITBUCKET_ISSUE_STATE,
        },
        limit: {
          type: 'number',
          description: `Maximum number of issues (default: ${PAGINATION.BITBUCKET_DEFAULT_LIMIT})`,
          default: PAGINATION.BITBUCKET_DEFAULT_LIMIT,
        },
      },
      required: ['repoName'],
    },
  },
  {
    name: 'bitbucket_create_issue',
    description: 'Create a new issue in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        title: {
          type: 'string',
          description: 'Issue title',
        },
        content: {
          type: 'string',
          description: 'Issue content/description',
        },
        kind: {
          type: 'string',
          description: `Issue kind (bug, enhancement, proposal, task) (default: ${DEFAULTS.BITBUCKET_ISSUE_KIND})`,
          default: DEFAULTS.BITBUCKET_ISSUE_KIND,
        },
      },
      required: ['repoName', 'title'],
    },
  },
  {
    name: 'bitbucket_get_pr_diffstat',
    description: 'Get per-file change summary for a pull request: path, status, lines_added, lines_removed (follows pagination, up to 1000 files)',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_get_pr_file_diff',
    description: 'Get the diff of a single file in a pull request (use bitbucket_get_pr_diffstat to list files). Output capped at 200KB.',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        path: {
          type: 'string',
          description: 'File path within the repository',
        },
      },
      required: ['repoName', 'prId', 'path'],
    },
  },
  {
    name: 'bitbucket_get_file_content',
    description: 'Get file content from a repository at a branch or commit. Defaults to the repo main branch. Text output capped at 200KB; binary files return metadata only.',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        path: {
          type: 'string',
          description: 'File path within the repository',
        },
        ref: {
          type: 'string',
          description: 'Branch name or commit hash (default: repo main branch)',
        },
      },
      required: ['repoName', 'path'],
    },
  },
  {
    name: 'bitbucket_get_pr_statuses',
    description: 'Get CI/build statuses for a pull request (key, name, state, url, updated_on) with a summary: allSuccessful and counts by state',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_get_pipelines',
    description: 'List recent Bitbucket Pipelines runs, newest first, optionally filtered by branch',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        branch: {
          type: 'string',
          description: 'Only pipelines targeting this branch',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of pipelines (default: 10)',
        },
      },
      required: ['repoName'],
    },
  },
  {
    name: 'bitbucket_get_pipeline_steps',
    description: 'Get per-step status of a pipeline run',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        pipelineUuid: {
          type: 'string',
          description: 'Pipeline UUID (from bitbucket_get_pipelines, braces included)',
        },
      },
      required: ['repoName', 'pipelineUuid'],
    },
  },
  {
    name: 'bitbucket_get_pipeline_step_log',
    description: 'Get the log of a pipeline step (last 200KB, since failures are at the end)',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        pipelineUuid: {
          type: 'string',
          description: 'Pipeline UUID (from bitbucket_get_pipelines, braces included)',
        },
        stepUuid: {
          type: 'string',
          description: 'Step UUID (from bitbucket_get_pipeline_steps, braces included)',
        },
      },
      required: ['repoName', 'pipelineUuid', 'stepUuid'],
    },
  },
  {
    name: 'bitbucket_get_pr_comments',
    description: 'Get all comments for a Bitbucket pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_add_pr_comment',
    description: 'Add a comment to a Bitbucket pull request. Supports both general and inline (file/line) comments.',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        content: {
          type: 'string',
          description: 'Comment content (Markdown supported)',
        },
        inlinePath: {
          type: 'string',
          description: 'File path for an inline comment (optional)',
        },
        inlineFrom: {
          type: 'number',
          description: 'Source side line number for inline comment (optional)',
        },
        inlineTo: {
          type: 'number',
          description: 'Destination side line number for inline comment (optional)',
        },
        parentId: {
          type: 'number',
          description: 'Parent comment ID to reply to (optional)',
        },
      },
      required: ['repoName', 'prId', 'content'],
    },
  },
  {
    name: 'bitbucket_update_pr_comment',
    description: 'Update an existing comment on a Bitbucket pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        commentId: {
          type: 'number',
          description: 'The comment ID to update',
        },
        content: {
          type: 'string',
          description: 'New comment content',
        },
      },
      required: ['repoName', 'prId', 'commentId', 'content'],
    },
  },
  {
    name: 'bitbucket_delete_pr_comment',
    description: 'Delete a comment from a Bitbucket pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        commentId: {
          type: 'number',
          description: 'The comment ID to delete',
        },
      },
      required: ['repoName', 'prId', 'commentId'],
    },
  },
  {
    name: 'bitbucket_resolve_pr_comment',
    description: 'Resolve a comment on a Bitbucket pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        commentId: {
          type: 'number',
          description: 'The comment ID to resolve',
        },
      },
      required: ['repoName', 'prId', 'commentId'],
    },
  },
  {
    name: 'bitbucket_unresolve_pr_comment',
    description: 'Unresolve (reopen) a comment on a Bitbucket pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        commentId: {
          type: 'number',
          description: 'The comment ID to unresolve',
        },
      },
      required: ['repoName', 'prId', 'commentId'],
    },
  },
  {
    name: 'bitbucket_approve_pr',
    description: 'Approve a Bitbucket pull request as the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_unapprove_pr',
    description: 'Remove your approval from a Bitbucket pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_request_changes_pr',
    description: 'Request changes on a Bitbucket pull request as the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_remove_change_request_pr',
    description: 'Remove your change request from a Bitbucket pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_merge_pr',
    description: 'Merge a Bitbucket pull request. Returns id, state and merge commit hash; for long-running merges returns a task status URL.',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
        mergeStrategy: {
          type: 'string',
          enum: ['merge_commit', 'squash', 'fast_forward', 'squash_fast_forward', 'rebase_fast_forward', 'rebase_merge'],
          description: 'Merge strategy (default: repository default)',
        },
        message: {
          type: 'string',
          description: 'Merge commit message',
        },
        closeSourceBranch: {
          type: 'boolean',
          description: 'Close the source branch after merging',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
  {
    name: 'bitbucket_decline_pr',
    description: 'Decline a Bitbucket pull request',
    inputSchema: {
      type: 'object',
      properties: {
        repoName: {
          type: 'string',
          description: 'Repository name',
        },
        prId: {
          type: 'number',
          description: 'Pull request ID',
        },
      },
      required: ['repoName', 'prId'],
    },
  },
];
