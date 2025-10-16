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
        description: 'Create a new Jira issue with support for custom fields including due dates',
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
            },
            duedate: {
              type: 'string',
              description: 'Due date in YYYY-MM-DD format (e.g., 2024-12-31)'
            },
            priority: {
              type: 'string',
              description: 'Priority name (e.g., High, Medium, Low)'
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of label strings'
            },
            components: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of component names'
            },
            assignee: {
              type: 'string',
              description: 'Account ID of the assignee'
            },
            customFields: {
              type: 'object',
              description: 'Additional custom fields as key-value pairs'
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
        name: 'jira_get_comments',
        description: 'Get all comments for a Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key to get comments for'
            }
          },
          required: ['issueKey']
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
        name: 'jira_get_issue_transitions',
        description: 'Get available transitions for a Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key (e.g., PROJECT-123)'
            }
          },
          required: ['issueKey']
        }
      },
      {
        name: 'jira_transition_issue',
        description: 'Transition a Jira issue to a different status with smart field handling',
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
            },
            fieldValues: {
              type: 'object',
              description: 'Optional field values for the transition'
            }
          },
          required: ['issueKey', 'transitionId']
        }
      },
      {
        name: 'jira_transition_issue_interactive',
        description: 'Transition a Jira issue with automatic field suggestion and validation',
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
            },
            fieldValues: {
              type: 'object',
              description: 'Optional field values for the transition'
            }
          },
          required: ['issueKey', 'transitionId']
        }
      },
      {
        name: 'jira_get_attachments',
        description: 'Get all attachments for a Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key to get attachments for'
            }
          },
          required: ['issueKey']
        }
      },
      {
        name: 'jira_add_attachment',
        description: 'Add an attachment to a Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key to attach file to'
            },
            filename: {
              type: 'string',
              description: 'The filename for the attachment'
            },
            fileContent: {
              type: 'string',
              description: 'Base64 encoded file content'
            }
          },
          required: ['issueKey', 'filename', 'fileContent']
        }
      },
      {
        name: 'jira_delete_attachment',
        description: 'Delete an attachment from a Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            attachmentId: {
              type: 'string',
              description: 'The attachment ID to delete'
            }
          },
          required: ['attachmentId']
        }
      },
      {
        name: 'jira_get_issue_links',
        description: 'Get all issue links for a Jira issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: 'The issue key to get links for'
            }
          },
          required: ['issueKey']
        }
      },
      {
        name: 'jira_create_issue_link',
        description: 'Create a link between two Jira issues',
        inputSchema: {
          type: 'object',
          properties: {
            inwardIssueKey: {
              type: 'string',
              description: 'The inward issue key'
            },
            outwardIssueKey: {
              type: 'string',
              description: 'The outward issue key'
            },
            linkType: {
              type: 'string',
              description: 'Link type name (e.g., "Blocks", "Relates", "Duplicates")'
            }
          },
          required: ['inwardIssueKey', 'outwardIssueKey', 'linkType']
        }
      },
      {
        name: 'jira_delete_issue_link',
        description: 'Delete a link between Jira issues',
        inputSchema: {
          type: 'object',
          properties: {
            linkId: {
              type: 'string',
              description: 'The link ID to delete'
            }
          },
          required: ['linkId']
        }
      },
      {
        name: 'jira_get_link_types',
        description: 'Get all available issue link types in Jira',
        inputSchema: {
          type: 'object',
          properties: {}
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
        try {
          const pages = await confluenceService.searchPages({ query, limit });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pages, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to search Confluence pages\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Query: ${query || 'none'}\n- Limit: ${limit || 25}\n\n**Tip:** Check your Confluence permissions and that the domain is accessible.`
              }
            ],
            isError: true
          };
        }
      }

      case 'confluence_get_page': {
        const { pageId } = args as { pageId: string };
        try {
          const page = await confluenceService.getPage(pageId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(page, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get Confluence page\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Page ID: ${pageId}\n\n**Tip:** Check if the page ID exists and you have permission to view it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'confluence_create_page': {
        const { spaceKey, title, content, parentId } = args as {
          spaceKey: string;
          title: string;
          content: string;
          parentId?: string;
        };
        try {
          const page = await confluenceService.createPage(spaceKey, title, content, parentId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(page, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to create Confluence page\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Space Key: ${spaceKey}\n- Title: ${title}\n- Parent ID: ${parentId || 'none'}\n\n**Tip:** Check if the space exists and you have permission to create pages in it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'confluence_update_page': {
        const { pageId, title, content, version } = args as {
          pageId: string;
          title: string;
          content: string;
          version: number;
        };
        try {
          const page = await confluenceService.updatePage(pageId, title, content, version);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(page, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to update Confluence page\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Page ID: ${pageId}\n- Title: ${title}\n- Version: ${version}\n\n**Tip:** Check if the page exists, version is correct, and you have permission to edit it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'confluence_get_spaces': {
        const { limit } = args as { limit?: number };
        try {
          const spaces = await confluenceService.getSpaces(limit);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(spaces, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get Confluence spaces\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Limit: ${limit || 25}\n\n**Tip:** Check your Confluence permissions and API access.`
              }
            ],
            isError: true
          };
        }
      }

      case 'confluence_get_pages_by_space': {
        const { spaceKey, limit } = args as { spaceKey: string; limit?: number };
        try {
          const pages = await confluenceService.getPagesBySpace(spaceKey, limit);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pages, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get pages from Confluence space\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Space Key: ${spaceKey}\n- Limit: ${limit || 25}\n\n**Tip:** Check if the space key exists and you have permission to view it.`
              }
            ],
            isError: true
          };
        }
      }

      // Jira Tools
      case 'jira_search_issues': {
        const { query, limit } = args as { query?: string; limit?: number };
        try {
          const issues = await jiraService.searchIssues({ query, limit });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(issues, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to search Jira issues\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Query: ${query || 'none'}\n- Limit: ${limit || 50}\n\n**Tip:** Check your JQL syntax and Jira permissions.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_get_issue': {
        const { issueKey } = args as { issueKey: string };
        try {
          const issue = await jiraService.getIssue(issueKey);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(issue, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get Jira issue\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Issue Key: ${issueKey}\n\n**Tip:** Check if the issue key exists and you have permission to view it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_create_issue': {
        const {
          projectKey,
          summary,
          description,
          issueType,
          duedate,
          priority,
          labels,
          components,
          assignee,
          customFields
        } = args as {
          projectKey: string;
          summary: string;
          description: string;
          issueType?: string;
          duedate?: string;
          priority?: string;
          labels?: string[];
          components?: string[];
          assignee?: string;
          customFields?: Record<string, any>;
        };
        try {
          const additionalFields = {
            duedate,
            priority,
            labels,
            components,
            assignee,
            customFields
          };
          const issue = await jiraService.createIssue(projectKey, summary, description, issueType, additionalFields);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(issue, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to create Jira issue\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Project: ${projectKey}\n- Summary: ${summary}\n- Issue Type: ${issueType || 'Task'}\n- Due Date: ${duedate || 'none'}\n- Priority: ${priority || 'none'}\n- Labels: ${labels?.join(', ') || 'none'}\n- Components: ${components?.join(', ') || 'none'}\n- Assignee: ${assignee || 'none'}\n\n**Tip:** Check if all required fields are provided and project exists. For custom fields, ensure field IDs are correct.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_update_issue': {
        const { issueKey, summary, description, assignee } = args as {
          issueKey: string;
          summary?: string;
          description?: string;
          assignee?: string;
        };
        try {
          const issue = await jiraService.updateIssue(issueKey, { summary, description, assignee });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(issue, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to update Jira issue ${issueKey}\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request Fields:**\n- Summary: ${summary || 'unchanged'}\n- Description: ${description || 'unchanged'}\n- Assignee: ${assignee || 'unchanged'}\n\n**Tip:** Check if the issue exists and you have permission to update it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_add_comment': {
        const { issueKey, comment } = args as { issueKey: string; comment: string };
        try {
          await jiraService.addComment(issueKey, comment);
          return {
            content: [
              {
                type: 'text',
                text: `Comment added to issue ${issueKey}`
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to add comment to Jira issue\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Issue Key: ${issueKey}\n- Comment: ${comment.substring(0, 100)}...\n\n**Tip:** Check if the issue exists and you have permission to comment on it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_get_comments': {
        const { issueKey } = args as { issueKey: string };
        try {
          const comments = await jiraService.getComments(issueKey);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(comments, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get comments for Jira issue\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Issue Key: ${issueKey}\n\n**Tip:** Check if the issue exists and you have permission to view it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_get_projects': {
        try {
          const projects = await jiraService.getProjects();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(projects, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get Jira projects\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Tip:** Check your Jira permissions and API access.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_get_issue_transitions': {
        const { issueKey } = args as { issueKey: string };
        try {
          const transitions = await jiraService.getIssueTransitions(issueKey);

          const transitionInfo = transitions.map(t => ({
            id: t.id,
            name: t.name,
            to: t.to?.name || 'Unknown status'
          }));

          return {
            content: [
              {
                type: 'text',
                text: `Available transitions for ${issueKey}:\n\n${transitionInfo.map(t => `• **${t.name}** (ID: ${t.id}) → ${t.to}`).join('\n')}\n\nUse the transition ID with jira_transition_issue_interactive for smart field handling.`
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get transitions for Jira issue\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Issue Key: ${issueKey}\n\n**Tip:** Check if the issue exists and you have permission to view it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_transition_issue': {
        const { issueKey, transitionId, fieldValues } = args as {
          issueKey: string;
          transitionId: string;
          fieldValues?: Record<string, any>
        };

        try {
          const result = await jiraService.transitionIssue(issueKey, transitionId, fieldValues);

          if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: result.message || `Issue ${issueKey} transitioned successfully`
              }
            ]
          };
        } else if (result.requiresInput && result.requiredFields) {
          // Format required fields information for user
          const fieldInfo = result.requiredFields.map(field => {
            let info = `• **${field.name}** (${field.key})`;
            if (field.options) {
              info += `\n  Options: ${field.options.map(opt => `${opt.value} (${opt.id})`).join(', ')}`;
            }
            if (field.suggestion) {
              info += `\n  💡 Suggestion: "${field.suggestion.value}" - ${field.suggestion.reason}`;
            }
            return info;
          }).join('\n\n');

          return {
            content: [
              {
                type: 'text',
                text: `${result.message}\n\n**Required Fields:**\n${fieldInfo}\n\n**Next Steps:**\nUse jira_transition_issue_interactive for automatic field suggestion, or provide fieldValues with the correct field IDs and values.`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: result.message || 'Transition failed with unknown error'
              }
            ],
            isError: true
          };
        }
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to transition Jira issue ${issueKey}\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Transition ID: ${transitionId}\n- Field Values: ${JSON.stringify(fieldValues || {}, null, 2)}\n\n**Tip:** Check if the transition ID is valid for this issue and you have permission to transition it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_transition_issue_interactive': {
        const { issueKey, transitionId, fieldValues } = args as {
          issueKey: string;
          transitionId: string;
          fieldValues?: Record<string, any>
        };

        try {
          const result = await jiraService.transitionIssueInteractive(issueKey, transitionId, fieldValues);

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: result.message || `Issue ${issueKey} transitioned successfully`
              }
            ]
          };
        } else if (result.requiresInput && result.requiredFields) {
          // Still need user input even after smart suggestions
          const fieldInfo = result.requiredFields.map(field => {
            let info = `• **${field.name}** (${field.key})`;
            if (field.options) {
              info += `\n  Options: ${field.options.map(opt => `${opt.value} (${opt.id})`).join(', ')}`;
            }
            if (field.suggestion) {
              info += `\n  💡 Suggestion: "${field.suggestion.value}" - ${field.suggestion.reason}`;
            }
            return info;
          }).join('\n\n');

          return {
            content: [
              {
                type: 'text',
                text: `${result.message}\n\n**Fields still requiring input:**\n${fieldInfo}`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: result.message || 'Transition failed with unknown error'
              }
            ],
            isError: true
          };
        }
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to transition Jira issue ${issueKey} (interactive mode)\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Transition ID: ${transitionId}\n- Field Values: ${JSON.stringify(fieldValues || {}, null, 2)}\n\n**Tip:** Check if the transition ID is valid for this issue and you have permission to transition it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_get_attachments': {
        const { issueKey } = args as { issueKey: string };
        try {
          const attachments = await jiraService.getAttachments(issueKey);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(attachments, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get attachments for Jira issue\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Issue Key: ${issueKey}\n\n**Tip:** Check if the issue exists and you have permission to view it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_add_attachment': {
        const { issueKey, filename, fileContent } = args as { issueKey: string; filename: string; fileContent: string };
        try {
          const result = await jiraService.addAttachment(issueKey, filename, fileContent);
          return {
            content: [
              {
                type: 'text',
                text: `Attachment "${filename}" added to issue ${issueKey}\n\n${JSON.stringify(result, null, 2)}`
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to add attachment to Jira issue\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Issue Key: ${issueKey}\n- Filename: ${filename}\n\n**Tip:** Check if the issue exists, you have permission to attach files, and the file content is properly base64 encoded.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_delete_attachment': {
        const { attachmentId } = args as { attachmentId: string };
        try {
          await jiraService.deleteAttachment(attachmentId);
          return {
            content: [
              {
                type: 'text',
                text: `Attachment ${attachmentId} deleted successfully`
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to delete attachment\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Attachment ID: ${attachmentId}\n\n**Tip:** Check if the attachment exists and you have permission to delete it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_get_issue_links': {
        const { issueKey } = args as { issueKey: string };
        try {
          const links = await jiraService.getIssueLinks(issueKey);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(links, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get issue links\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Issue Key: ${issueKey}\n\n**Tip:** Check if the issue exists and you have permission to view it.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_create_issue_link': {
        const { inwardIssueKey, outwardIssueKey, linkType } = args as { inwardIssueKey: string; outwardIssueKey: string; linkType: string };
        try {
          await jiraService.createIssueLink(inwardIssueKey, outwardIssueKey, linkType);
          return {
            content: [
              {
                type: 'text',
                text: `Link created: ${inwardIssueKey} ${linkType} ${outwardIssueKey}`
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to create issue link\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Inward Issue: ${inwardIssueKey}\n- Outward Issue: ${outwardIssueKey}\n- Link Type: ${linkType}\n\n**Tip:** Check if both issues exist, the link type is valid, and you have permission to link issues. Use jira_get_link_types to see available link types.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_delete_issue_link': {
        const { linkId } = args as { linkId: string };
        try {
          await jiraService.deleteIssueLink(linkId);
          return {
            content: [
              {
                type: 'text',
                text: `Issue link ${linkId} deleted successfully`
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to delete issue link\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Link ID: ${linkId}\n\n**Tip:** Check if the link exists and you have permission to delete it. Use jira_get_issue_links to get link IDs.`
              }
            ],
            isError: true
          };
        }
      }

      case 'jira_get_link_types': {
        try {
          const linkTypes = await jiraService.getIssueLinkTypes();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(linkTypes, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get issue link types\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Tip:** Check your Jira permissions and API access.`
              }
            ],
            isError: true
          };
        }
      }

      // Bitbucket Tools
      case 'bitbucket_get_repositories': {
        const { query, limit } = args as { query?: string; limit?: number };
        try {
          const repos = await bitbucketService.getRepositories({ query, limit });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(repos, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get Bitbucket repositories\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Query: ${query || 'none'}\n- Limit: ${limit || 10}\n\n**Tip:** Check your Bitbucket permissions and API access.`
              }
            ],
            isError: true
          };
        }
      }

      case 'bitbucket_get_repository': {
        const { repoName } = args as { repoName: string };
        try {
          const repo = await bitbucketService.getRepository(repoName);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(repo, null, 2)
              }
            ]
          };
        } catch (error: any) {
          const errorDetails = error.response?.data || error.message;
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to get Bitbucket repository\n\n**Error Details:**\n${JSON.stringify(errorDetails, null, 2)}\n\n**Request:**\n- Repository: ${repoName}\n\n**Tip:** Check if the repository exists and you have access to it.`
              }
            ],
            isError: true
          };
        }
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