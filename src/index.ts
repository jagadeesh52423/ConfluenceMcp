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

// Import modular tool definitions
import { allTools } from './tools/index.js';

// Import modular handlers
import { ConfluenceHandlers } from './handlers/confluence-handlers.js';
import { JiraHandlers } from './handlers/jira-handlers.js';
import { BitbucketHandlers } from './handlers/bitbucket-handlers.js';

import { ERROR_MESSAGES } from './constants.js';

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

// Initialize services
const confluenceService = new ConfluenceService();
const jiraService = new JiraService();
const bitbucketService = new BitbucketService();

// Initialize handlers
const confluenceHandlers = new ConfluenceHandlers(confluenceService);
const jiraHandlers = new JiraHandlers(jiraService);
const bitbucketHandlers = new BitbucketHandlers(bitbucketService);

/**
 * List all available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

/**
 * Handle tool calls by routing to appropriate handlers
 */
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
  const { name, arguments: args } = request.params;

  try {
    // Confluence Tools
    switch (name) {
      case 'confluence_search_pages':
        return confluenceHandlers.searchPages(args as any);

      case 'confluence_get_page':
        return confluenceHandlers.getPage(args as any);

      case 'confluence_create_page':
        return confluenceHandlers.createPage(args as any);

      case 'confluence_update_page':
        return confluenceHandlers.updatePage(args as any);

      case 'confluence_get_spaces':
        return confluenceHandlers.getSpaces(args as any);

      case 'confluence_get_pages_by_space':
        return confluenceHandlers.getPagesBySpace(args as any);

      case 'confluence_get_attachments':
        return confluenceHandlers.getAttachments(args as any);

      case 'confluence_add_attachment':
        return confluenceHandlers.addAttachment(args as any);

      case 'confluence_delete_attachment':
        return confluenceHandlers.deleteAttachment(args as any);

      case 'confluence_embed_image':
        return confluenceHandlers.embedImage(args as any);

      case 'confluence_get_comments':
        return confluenceHandlers.getComments(args as any);

      case 'confluence_add_comment':
        return confluenceHandlers.addComment(args as any);

      case 'confluence_update_comment':
        return confluenceHandlers.updateComment(args as any);

      case 'confluence_delete_comment':
        return confluenceHandlers.deleteComment(args as any);

      // Jira Tools
      case 'jira_search_issues':
        return jiraHandlers.searchIssues(args as any);

      case 'jira_get_issue':
        return jiraHandlers.getIssue(args as any);

      case 'jira_create_issue':
        return jiraHandlers.createIssue(args as any);

      case 'jira_update_issue':
        return jiraHandlers.updateIssue(args as any);

      case 'jira_add_comment':
        return jiraHandlers.addComment(args as any);

      case 'jira_get_comments':
        return jiraHandlers.getComments(args as any);

      case 'jira_update_comment':
        return jiraHandlers.updateComment(args as any);

      case 'jira_delete_comment':
        return jiraHandlers.deleteComment(args as any);

      case 'jira_get_projects':
        return jiraHandlers.getProjects();

      case 'jira_get_issue_transitions':
        return jiraHandlers.getIssueTransitions(args as any);

      case 'jira_transition_issue':
        return jiraHandlers.transitionIssue(args as any);

      case 'jira_transition_issue_interactive':
        return jiraHandlers.transitionIssueInteractive(args as any);

      case 'jira_get_attachments':
        return jiraHandlers.getAttachments(args as any);

      case 'jira_add_attachment':
        return jiraHandlers.addAttachment(args as any);

      case 'jira_delete_attachment':
        return jiraHandlers.deleteAttachment(args as any);

      case 'jira_get_issue_links':
        return jiraHandlers.getIssueLinks(args as any);

      case 'jira_create_issue_link':
        return jiraHandlers.createIssueLink(args as any);

      case 'jira_delete_issue_link':
        return jiraHandlers.deleteIssueLink(args as any);

      case 'jira_get_link_types':
        return jiraHandlers.getLinkTypes();

      case 'jira_get_worklogs':
        return jiraHandlers.getWorklogs(args as any);

      case 'jira_add_worklog':
        return jiraHandlers.addWorklog(args as any);

      case 'jira_update_worklog':
        return jiraHandlers.updateWorklog(args as any);

      case 'jira_delete_worklog':
        return jiraHandlers.deleteWorklog(args as any);

      case 'jira_get_watchers':
        return jiraHandlers.getWatchers(args as any);

      case 'jira_add_watcher':
        return jiraHandlers.addWatcher(args as any);

      case 'jira_remove_watcher':
        return jiraHandlers.removeWatcher(args as any);

      case 'jira_get_subtasks':
        return jiraHandlers.getSubtasks(args as any);

      case 'jira_create_subtask':
        return jiraHandlers.createSubtask(args as any);

      case 'jira_get_issue_history':
        return jiraHandlers.getIssueHistory(args as any);

      case 'jira_get_fields':
        return jiraHandlers.getFields(args as any);

      case 'jira_get_labels':
        return jiraHandlers.getLabels(args as any);

      case 'jira_add_labels':
        return jiraHandlers.addLabels(args as any);

      case 'jira_remove_labels':
        return jiraHandlers.removeLabels(args as any);

      // Bitbucket Tools
      case 'bitbucket_get_repositories':
        return bitbucketHandlers.getRepositories(args as any);

      case 'bitbucket_get_repository':
        return bitbucketHandlers.getRepository(args as any);

      case 'bitbucket_create_repository':
        return bitbucketHandlers.createRepository(args as any);

      case 'bitbucket_get_pull_requests':
        return bitbucketHandlers.getPullRequests(args as any);

      case 'bitbucket_get_pull_request':
        return bitbucketHandlers.getPullRequest(args as any);

      case 'bitbucket_create_pull_request':
        return bitbucketHandlers.createPullRequest(args as any);

      case 'bitbucket_get_branches':
        return bitbucketHandlers.getBranches(args as any);

      case 'bitbucket_get_commits':
        return bitbucketHandlers.getCommits(args as any);

      case 'bitbucket_get_issues':
        return bitbucketHandlers.getIssues(args as any);

      case 'bitbucket_create_issue':
        return bitbucketHandlers.createIssue(args as any);

      case 'bitbucket_get_pr_comments':
        return bitbucketHandlers.getPRComments(args as any);

      case 'bitbucket_add_pr_comment':
        return bitbucketHandlers.addPRComment(args as any);

      case 'bitbucket_update_pr_comment':
        return bitbucketHandlers.updatePRComment(args as any);

      case 'bitbucket_delete_pr_comment':
        return bitbucketHandlers.deletePRComment(args as any);

      case 'bitbucket_resolve_pr_comment':
        return bitbucketHandlers.resolvePRComment(args as any);

      case 'bitbucket_unresolve_pr_comment':
        return bitbucketHandlers.unresolvePRComment(args as any);

      default:
        throw new Error(ERROR_MESSAGES.UNKNOWN_TOOL(name));
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
