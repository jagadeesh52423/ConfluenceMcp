#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { validateConfig } from './config.js';
import { ConfluenceService } from './services/confluence.js';
import { JiraService } from './services/jira.js';
import { BitbucketService } from './services/bitbucket.js';

const server = new Server(
  {
    name: 'atlassian-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const confluenceService = new ConfluenceService();
const jiraService = new JiraService();
const bitbucketService = new BitbucketService();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Confluence Tools
      {
        name: 'confluence_search_pages',
        description: 'Search Confluence pages by text query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Text to search for in pages'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 25)',
              default: 25
            }
          }
        }
      },
      {
        name: 'confluence_get_page',
        description: 'Get a specific Confluence page by ID',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'The page ID to retrieve'
            }
          },
          required: ['pageId']
        }
      },
      {
        name: 'confluence_create_page',
        description: 'Create a new Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            spaceKey: {
              type: 'string',
              description: 'The space key where to create the page'
            },
            title: {
              type: 'string',
              description: 'Page title'
            },
            content: {
              type: 'string',
              description: 'Page content in Confluence storage format'
            },
            parentId: {
              type: 'string',
              description: 'Optional parent page ID'
            }
          },
          required: ['spaceKey', 'title', 'content']
        }
      },
      {
        name: 'confluence_update_page',
        description: 'Update an existing Confluence page',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'The page ID to update'
            },
            title: {
              type: 'string',
              description: 'New page title'
            },
            content: {
              type: 'string',
              description: 'New page content in Confluence storage format'
            },
            version: {
              type: 'number',
              description: 'Current version number of the page'
            }
          },
          required: ['pageId', 'title', 'content', 'version']
        }
      },
      {
        name: 'confluence_get_spaces',
        description: 'Get list of Confluence spaces',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of spaces to return (default: 25)',
              default: 25
            }
          }
        }
      },
      {
        name: 'confluence_get_pages_by_space',
        description: 'Get pages from a specific Confluence space',
        inputSchema: {
          type: 'object',
          properties: {
            spaceKey: {
              type: 'string',
              description: 'The space key to get pages from'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of pages to return (default: 25)',
              default: 25
            }
          },
          required: ['spaceKey']
        }
      },

      // Jira Tools
      {
        name: 'jira_search_issues',
        description: 'Search Jira issues by text query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Text to search for in issues'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
              default: 50
            }
          }
        }
      },
      {
        name: 'jira_get_issue',
        description: 'Get a specific Jira issue by key',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key (e.g., PROJ-123)'
            }
          },
          required: ['issueKey']
        }
      },
      {
        name: 'jira_create_issue',
        description: 'Create a new Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            projectKey: {
              type: 'string',
              description: 'The project key where to create the issue'
            },
            summary: {
              type: 'string',
              description: 'Issue summary/title'
            },
            description: {
              type: 'string',
              description: 'Issue description'
            },
            issueType: {
              type: 'string',
              description: 'Issue type (default: Task)',
              default: 'Task'
            }
          },
          required: ['projectKey', 'summary', 'description']
        }
      },
      {
        name: 'jira_update_issue',
        description: 'Update an existing Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key to update'
            },
            summary: {
              type: 'string',
              description: 'New issue summary'
            },
            description: {
              type: 'string',
              description: 'New issue description'
            },
            assignee: {
              type: 'string',
              description: 'Account ID of the assignee'
            }
          },
          required: ['issueKey']
        }
      },
      {
        name: 'jira_add_comment',
        description: 'Add a comment to a Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key to comment on'
            },
            comment: {
              type: 'string',
              description: 'Comment text'
            }
          },
          required: ['issueKey', 'comment']
        }
      },
      {
        name: 'jira_get_projects',
        description: 'Get list of Jira projects',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'jira_transition_issue',
        description: 'Transition a Jira issue to a different status',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key to transition'
            },
            transitionId: {
              type: 'string',
              description: 'The transition ID'
            }
          },
          required: ['issueKey', 'transitionId']
        }
      },

      // Bitbucket Tools
      {
        name: 'bitbucket_get_repositories',
        description: 'Get list of Bitbucket repositories in workspace',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for repository names'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of repositories (default: 10)',
              default: 10
            }
          }
        }
      },
      {
        name: 'bitbucket_get_repository',
        description: 'Get details of a specific Bitbucket repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoName: {
              type: 'string',
              description: 'Repository name'
            }
          },
          required: ['repoName']
        }
      },
      {
        name: 'bitbucket_create_repository',
        description: 'Create a new Bitbucket repository',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Repository name'
            },
            description: {
              type: 'string',
              description: 'Repository description'
            },
            isPrivate: {
              type: 'boolean',
              description: 'Whether the repository should be private (default: true)',
              default: true
            },
            language: {
              type: 'string',
              description: 'Primary programming language'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'bitbucket_get_pull_requests',
        description: 'Get pull requests for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoName: {
              type: 'string',
              description: 'Repository name'
            },
            state: {
              type: 'string',
              description: 'Pull request state (OPEN, MERGED, DECLINED)',
              default: 'OPEN'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of pull requests (default: 10)',
              default: 10
            }
          },
          required: ['repoName']
        }
      },
      {
        name: 'bitbucket_create_pull_request',
        description: 'Create a new pull request',
        inputSchema: {
          type: 'object',
          properties: {
            repoName: {
              type: 'string',
              description: 'Repository name'
            },
            title: {
              type: 'string',
              description: 'Pull request title'
            },
            sourceBranch: {
              type: 'string',
              description: 'Source branch name'
            },
            destinationBranch: {
              type: 'string',
              description: 'Destination branch name (default: main)',
              default: 'main'
            },
            description: {
              type: 'string',
              description: 'Pull request description'
            }
          },
          required: ['repoName', 'title', 'sourceBranch']
        }
      },
      {
        name: 'bitbucket_get_branches',
        description: 'Get branches for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoName: {
              type: 'string',
              description: 'Repository name'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of branches (default: 10)',
              default: 10
            }
          },
          required: ['repoName']
        }
      },
      {
        name: 'bitbucket_get_commits',
        description: 'Get commits for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoName: {
              type: 'string',
              description: 'Repository name'
            },
            branch: {
              type: 'string',
              description: 'Branch name (default: main)',
              default: 'main'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of commits (default: 10)',
              default: 10
            }
          },
          required: ['repoName']
        }
      },
      {
        name: 'bitbucket_get_issues',
        description: 'Get issues for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoName: {
              type: 'string',
              description: 'Repository name'
            },
            state: {
              type: 'string',
              description: 'Issue state (open, closed)',
              default: 'open'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of issues (default: 10)',
              default: 10
            }
          },
          required: ['repoName']
        }
      },
      {
        name: 'bitbucket_create_issue',
        description: 'Create a new issue in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoName: {
              type: 'string',
              description: 'Repository name'
            },
            title: {
              type: 'string',
              description: 'Issue title'
            },
            content: {
              type: 'string',
              description: 'Issue content/description'
            },
            kind: {
              type: 'string',
              description: 'Issue kind (bug, enhancement, proposal, task)',
              default: 'bug'
            }
          },
          required: ['repoName', 'title']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Confluence Tools
      case 'confluence_search_pages': {
        const { query, limit } = args as { query?: string; limit?: number };
        const pages = await confluenceService.searchPages({ query, limit });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pages, null, 2)
            }
          ]
        };
      }

      case 'confluence_get_page': {
        const { pageId } = args as { pageId: string };
        const page = await confluenceService.getPage(pageId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(page, null, 2)
            }
          ]
        };
      }

      case 'confluence_create_page': {
        const { spaceKey, title, content, parentId } = args as {
          spaceKey: string;
          title: string;
          content: string;
          parentId?: string;
        };
        const page = await confluenceService.createPage(spaceKey, title, content, parentId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(page, null, 2)
            }
          ]
        };
      }

      case 'confluence_update_page': {
        const { pageId, title, content, version } = args as {
          pageId: string;
          title: string;
          content: string;
          version: number;
        };
        const page = await confluenceService.updatePage(pageId, title, content, version);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(page, null, 2)
            }
          ]
        };
      }

      case 'confluence_get_spaces': {
        const { limit } = args as { limit?: number };
        const spaces = await confluenceService.getSpaces(limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(spaces, null, 2)
            }
          ]
        };
      }

      case 'confluence_get_pages_by_space': {
        const { spaceKey, limit } = args as { spaceKey: string; limit?: number };
        const pages = await confluenceService.getPagesBySpace(spaceKey, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pages, null, 2)
            }
          ]
        };
      }

      // Jira Tools
      case 'jira_search_issues': {
        const { query, limit } = args as { query?: string; limit?: number };
        const issues = await jiraService.searchIssues({ query, limit });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues, null, 2)
            }
          ]
        };
      }

      case 'jira_get_issue': {
        const { issueKey } = args as { issueKey: string };
        const issue = await jiraService.getIssue(issueKey);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2)
            }
          ]
        };
      }

      case 'jira_create_issue': {
        const { projectKey, summary, description, issueType } = args as {
          projectKey: string;
          summary: string;
          description: string;
          issueType?: string;
        };
        const issue = await jiraService.createIssue(projectKey, summary, description, issueType);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2)
            }
          ]
        };
      }

      case 'jira_update_issue': {
        const { issueKey, summary, description, assignee } = args as {
          issueKey: string;
          summary?: string;
          description?: string;
          assignee?: string;
        };
        const issue = await jiraService.updateIssue(issueKey, { summary, description, assignee });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2)
            }
          ]
        };
      }

      case 'jira_add_comment': {
        const { issueKey, comment } = args as { issueKey: string; comment: string };
        await jiraService.addComment(issueKey, comment);
        return {
          content: [
            {
              type: 'text',
              text: `Comment added to issue ${issueKey}`
            }
          ]
        };
      }

      case 'jira_get_projects': {
        const projects = await jiraService.getProjects();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(projects, null, 2)
            }
          ]
        };
      }

      case 'jira_transition_issue': {
        const { issueKey, transitionId } = args as { issueKey: string; transitionId: string };
        await jiraService.transitionIssue(issueKey, transitionId);
        return {
          content: [
            {
              type: 'text',
              text: `Issue ${issueKey} transitioned successfully`
            }
          ]
        };
      }

      // Bitbucket Tools
      case 'bitbucket_get_repositories': {
        const { query, limit } = args as { query?: string; limit?: number };
        const repos = await bitbucketService.getRepositories({ query, limit });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(repos, null, 2)
            }
          ]
        };
      }

      case 'bitbucket_get_repository': {
        const { repoName } = args as { repoName: string };
        const repo = await bitbucketService.getRepository(repoName);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(repo, null, 2)
            }
          ]
        };
      }

      case 'bitbucket_create_repository': {
        const { name, description, isPrivate, language } = args as {
          name: string;
          description?: string;
          isPrivate?: boolean;
          language?: string;
        };
        const repo = await bitbucketService.createRepository(name, description, isPrivate, language);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(repo, null, 2)
            }
          ]
        };
      }

      case 'bitbucket_get_pull_requests': {
        const { repoName, state, limit } = args as { repoName: string; state?: string; limit?: number };
        const prs = await bitbucketService.getPullRequests(repoName, state, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(prs, null, 2)
            }
          ]
        };
      }

      case 'bitbucket_create_pull_request': {
        const { repoName, title, sourceBranch, destinationBranch, description } = args as {
          repoName: string;
          title: string;
          sourceBranch: string;
          destinationBranch?: string;
          description?: string;
        };
        const pr = await bitbucketService.createPullRequest(repoName, title, sourceBranch, destinationBranch, description);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(pr, null, 2)
            }
          ]
        };
      }

      case 'bitbucket_get_branches': {
        const { repoName, limit } = args as { repoName: string; limit?: number };
        const branches = await bitbucketService.getBranches(repoName, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(branches, null, 2)
            }
          ]
        };
      }

      case 'bitbucket_get_commits': {
        const { repoName, branch, limit } = args as { repoName: string; branch?: string; limit?: number };
        const commits = await bitbucketService.getCommits(repoName, branch, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(commits, null, 2)
            }
          ]
        };
      }

      case 'bitbucket_get_issues': {
        const { repoName, state, limit } = args as { repoName: string; state?: string; limit?: number };
        const issues = await bitbucketService.getIssues(repoName, state, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues, null, 2)
            }
          ]
        };
      }

      case 'bitbucket_create_issue': {
        const { repoName, title, content, kind } = args as {
          repoName: string;
          title: string;
          content?: string;
          kind?: string;
        };
        const issue = await bitbucketService.createIssue(repoName, title, content, kind);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ],
      isError: true
    };
  }
});

async function main() {
  try {
    validateConfig();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Atlassian MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();