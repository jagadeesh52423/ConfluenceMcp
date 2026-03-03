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

import { allTools } from './tools/index.js';

import { ConfluenceHandlers } from './handlers/confluence-handlers.js';
import { JiraHandlers } from './handlers/jira-handlers.js';
import { BitbucketHandlers } from './handlers/bitbucket-handlers.js';

import { ToolRegistry } from './registry/tool-registry.js';

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
const c = new ConfluenceHandlers(confluenceService);
const j = new JiraHandlers(jiraService);
const b = new BitbucketHandlers(bitbucketService);

// Register all tools
const registry = new ToolRegistry();
registry.registerAll({
  // Confluence
  'confluence_search_pages':       (a) => c.searchPages(a),
  'confluence_get_page':           (a) => c.getPage(a),
  'confluence_create_page':        (a) => c.createPage(a),
  'confluence_update_page':        (a) => c.updatePage(a),
  'confluence_get_spaces':         (a) => c.getSpaces(a),
  'confluence_get_pages_by_space': (a) => c.getPagesBySpace(a),
  'confluence_get_attachments':    (a) => c.getAttachments(a),
  'confluence_add_attachment':     (a) => c.addAttachment(a),
  'confluence_delete_attachment':  (a) => c.deleteAttachment(a),
  'confluence_embed_image':        (a) => c.embedImage(a),
  'confluence_get_comments':       (a) => c.getComments(a),
  'confluence_add_comment':        (a) => c.addComment(a),
  'confluence_update_comment':     (a) => c.updateComment(a),
  'confluence_delete_comment':     (a) => c.deleteComment(a),
  'confluence_get_page_children':  (a) => c.getPageChildren(a),
  'confluence_get_labels':         (a) => c.getLabels(a),
  'confluence_add_labels':         (a) => c.addLabels(a),
  'confluence_remove_label':       (a) => c.removeLabel(a),
  'confluence_delete_page':        (a) => c.deletePage(a),
  'confluence_get_page_history':   (a) => c.getPageHistory(a),

  // Jira — Issues
  'jira_search_issues':              (a) => j.searchIssues(a),
  'jira_get_issue':                  (a) => j.getIssue(a),
  'jira_create_issue':               (a) => j.createIssue(a),
  'jira_update_issue':               (a) => j.updateIssue(a),
  'jira_delete_issue':               (a) => j.deleteIssue(a),
  'jira_batch_create_issues':        (a) => j.batchCreateIssues(a),
  'jira_get_issue_history':          (a) => j.getIssueHistory(a),
  'jira_get_dev_status':             (a) => j.getDevStatus(a),

  // Jira — Transitions
  'jira_get_issue_transitions':      (a) => j.getIssueTransitions(a),
  'jira_transition_issue':           (a) => j.transitionIssue(a),
  'jira_transition_issue_interactive': (a) => j.transitionIssueInteractive(a),

  // Jira — Comments
  'jira_add_comment':                (a) => j.addComment(a),
  'jira_get_comments':               (a) => j.getComments(a),
  'jira_update_comment':             (a) => j.updateComment(a),
  'jira_delete_comment':             (a) => j.deleteComment(a),

  // Jira — Attachments
  'jira_get_attachments':            (a) => j.getAttachments(a),
  'jira_add_attachment':             (a) => j.addAttachment(a),
  'jira_delete_attachment':          (a) => j.deleteAttachment(a),

  // Jira — Links
  'jira_get_issue_links':            (a) => j.getIssueLinks(a),
  'jira_create_issue_link':          (a) => j.createIssueLink(a),
  'jira_delete_issue_link':          (a) => j.deleteIssueLink(a),
  'jira_get_link_types':             ()  => j.getLinkTypes(),
  'jira_link_to_epic':               (a) => j.linkToEpic(a),

  // Jira — Worklogs
  'jira_get_worklogs':               (a) => j.getWorklogs(a),
  'jira_add_worklog':                (a) => j.addWorklog(a),
  'jira_update_worklog':             (a) => j.updateWorklog(a),
  'jira_delete_worklog':             (a) => j.deleteWorklog(a),

  // Jira — Watchers
  'jira_get_watchers':               (a) => j.getWatchers(a),
  'jira_add_watcher':                (a) => j.addWatcher(a),
  'jira_remove_watcher':             (a) => j.removeWatcher(a),

  // Jira — Labels
  'jira_get_labels':                 (a) => j.getLabels(a),
  'jira_add_labels':                 (a) => j.addLabels(a),
  'jira_remove_labels':              (a) => j.removeLabels(a),

  // Jira — Subtasks
  'jira_get_subtasks':               (a) => j.getSubtasks(a),
  'jira_create_subtask':             (a) => j.createSubtask(a),

  // Jira — Agile
  'jira_get_agile_boards':           (a) => j.getAgileBoards(a),
  'jira_get_board_issues':           (a) => j.getBoardIssues(a),
  'jira_get_sprints':                (a) => j.getSprints(a),
  'jira_get_sprint_issues':          (a) => j.getSprintIssues(a),
  'jira_move_issues_to_sprint':      (a) => j.moveIssuesToSprint(a),
  'jira_create_sprint':              (a) => j.createSprint(a),
  'jira_update_sprint':              (a) => j.updateSprint(a),

  // Jira — Versions
  'jira_get_project_versions':       (a) => j.getProjectVersions(a),
  'jira_create_version':             (a) => j.createVersion(a),
  'jira_update_version':             (a) => j.updateVersion(a),

  // Jira — Metadata
  'jira_get_projects':               ()  => j.getProjects(),
  'jira_get_issue_types':            (a) => j.getIssueTypes(a),
  'jira_get_fields':                 (a) => j.getFields(a),
  'jira_lookup_user':                (a) => j.lookupUser(a),

  // Bitbucket
  'bitbucket_get_repositories':      (a) => b.getRepositories(a),
  'bitbucket_get_repository':        (a) => b.getRepository(a),
  'bitbucket_create_repository':     (a) => b.createRepository(a),
  'bitbucket_get_pull_requests':     (a) => b.getPullRequests(a),
  'bitbucket_get_pull_request':      (a) => b.getPullRequest(a),
  'bitbucket_create_pull_request':   (a) => b.createPullRequest(a),
  'bitbucket_get_branches':          (a) => b.getBranches(a),
  'bitbucket_get_commits':           (a) => b.getCommits(a),
  'bitbucket_get_issues':            (a) => b.getIssues(a),
  'bitbucket_create_issue':          (a) => b.createIssue(a),
  'bitbucket_get_pr_comments':       (a) => b.getPRComments(a),
  'bitbucket_add_pr_comment':        (a) => b.addPRComment(a),
  'bitbucket_update_pr_comment':     (a) => b.updatePRComment(a),
  'bitbucket_delete_pr_comment':     (a) => b.deletePRComment(a),
  'bitbucket_resolve_pr_comment':    (a) => b.resolvePRComment(a),
  'bitbucket_unresolve_pr_comment':  (a) => b.unresolvePRComment(a),
});

/**
 * List all available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

/**
 * Handle tool calls via registry dispatch
 */
server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
  const { name, arguments: args } = request.params;
  try {
    return await registry.dispatch(name, args);
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
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
