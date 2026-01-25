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
      },
      required: ['repoName', 'title', 'sourceBranch'],
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
];
