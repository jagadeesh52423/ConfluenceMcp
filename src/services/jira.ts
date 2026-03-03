import { JiraClient } from '../clients/jira-client.js';
import { JiraIssue, SearchOptions, JiraTransitionResponse } from '../types.js';

import { JiraIssueService } from './jira/issues.js';
import { JiraTransitionService } from './jira/transitions.js';
import { JiraCommentService } from './jira/comments.js';
import { JiraAttachmentService } from './jira/attachments.js';
import { JiraLinkService } from './jira/links.js';
import { JiraWorklogService } from './jira/worklogs.js';
import { JiraWatcherService } from './jira/watchers.js';
import { JiraLabelService } from './jira/labels.js';
import { JiraSubtaskService } from './jira/subtasks.js';
import { JiraAgileService } from './jira/agile.js';
import { JiraVersionService } from './jira/versions.js';
import { JiraMetadataService } from './jira/metadata.js';

export class JiraService {
  private readonly issues: JiraIssueService;
  private readonly transitions: JiraTransitionService;
  private readonly comments: JiraCommentService;
  private readonly attachments: JiraAttachmentService;
  private readonly links: JiraLinkService;
  private readonly worklogs: JiraWorklogService;
  private readonly watchers: JiraWatcherService;
  private readonly labels: JiraLabelService;
  private readonly subtasks: JiraSubtaskService;
  private readonly agile: JiraAgileService;
  private readonly versions: JiraVersionService;
  private readonly metadata: JiraMetadataService;

  constructor() {
    const client = new JiraClient();
    this.issues      = new JiraIssueService(client);
    this.comments    = new JiraCommentService(client);
    this.attachments = new JiraAttachmentService(client);
    this.links       = new JiraLinkService(client);
    this.worklogs    = new JiraWorklogService(client);
    this.watchers    = new JiraWatcherService(client);
    this.labels      = new JiraLabelService(client);
    this.subtasks    = new JiraSubtaskService(client, this.issues);
    this.agile       = new JiraAgileService(client);
    this.versions    = new JiraVersionService(client);
    this.metadata    = new JiraMetadataService(client);
    this.transitions = new JiraTransitionService(client, this.issues);
  }

  // Issues
  searchIssues(opts?: SearchOptions)                                           { return this.issues.searchIssues(opts); }
  getIssue(key: string, fields?: string[])                                     { return this.issues.getIssue(key, fields); }
  createIssue(...args: Parameters<JiraIssueService['createIssue']>)            { return this.issues.createIssue(...args); }
  updateIssue(...args: Parameters<JiraIssueService['updateIssue']>)            { return this.issues.updateIssue(...args); }
  deleteIssue(key: string, deleteSubtasks?: boolean)                           { return this.issues.deleteIssue(key, deleteSubtasks); }
  assignIssue(key: string, accountId: string)                                  { return this.issues.assignIssue(key, accountId); }
  batchCreateIssues(...args: Parameters<JiraIssueService['batchCreateIssues']>){ return this.issues.batchCreateIssues(...args); }
  getIssueHistory(key: string)                                                 { return this.issues.getIssueHistory(key); }
  getDevStatus(id: string, appType?: string, dataType?: string)                { return this.issues.getDevStatus(id, appType, dataType); }

  // Transitions
  getIssueTransitions(key: string)                                             { return this.transitions.getIssueTransitions(key); }
  transitionIssue(key: string, transitionId: string, fields?: Record<string, any>) { return this.transitions.transitionIssue(key, transitionId, fields); }
  transitionIssueInteractive(key: string, transitionId: string, fields?: Record<string, any>) { return this.transitions.transitionIssueInteractive(key, transitionId, fields); }

  // Comments
  addComment(key: string, comment: string)                                     { return this.comments.addComment(key, comment); }
  getComments(key: string)                                                     { return this.comments.getComments(key); }
  updateComment(key: string, commentId: string, comment: string)               { return this.comments.updateComment(key, commentId, comment); }
  deleteComment(key: string, commentId: string)                                { return this.comments.deleteComment(key, commentId); }

  // Attachments
  getAttachments(key: string)                                                  { return this.attachments.getAttachments(key); }
  addAttachment(key: string, filename: string, content: string)               { return this.attachments.addAttachment(key, filename, content); }
  deleteAttachment(attachmentId: string)                                       { return this.attachments.deleteAttachment(attachmentId); }

  // Links
  getIssueLinks(key: string)                                                   { return this.links.getIssueLinks(key); }
  createIssueLink(inward: string, outward: string, type: string)               { return this.links.createIssueLink(inward, outward, type); }
  deleteIssueLink(linkId: string)                                              { return this.links.deleteIssueLink(linkId); }
  getIssueLinkTypes()                                                          { return this.links.getIssueLinkTypes(); }
  linkToEpic(key: string, epicKey: string)                                     { return this.links.linkToEpic(key, epicKey); }

  // Worklogs
  getWorkLogs(key: string)                                                     { return this.worklogs.getWorkLogs(key); }
  addWorkLog(key: string, seconds: number, comment?: string, started?: string) { return this.worklogs.addWorkLog(key, seconds, comment, started); }
  updateWorkLog(key: string, worklogId: string, seconds?: number, comment?: string) { return this.worklogs.updateWorkLog(key, worklogId, seconds, comment); }
  deleteWorkLog(key: string, worklogId: string)                                { return this.worklogs.deleteWorkLog(key, worklogId); }

  // Watchers
  getWatchers(key: string)                                                     { return this.watchers.getWatchers(key); }
  addWatcher(key: string, accountId: string)                                   { return this.watchers.addWatcher(key, accountId); }
  removeWatcher(key: string, accountId: string)                                { return this.watchers.removeWatcher(key, accountId); }

  // Labels
  getLabels(query?: string, maxResults?: number)                               { return this.labels.getLabels(query, maxResults); }
  addLabels(key: string, labels: string[])                                     { return this.labels.addLabels(key, labels); }
  removeLabels(key: string, labels: string[])                                  { return this.labels.removeLabels(key, labels); }

  // Subtasks
  getSubTasks(key: string)                                                     { return this.subtasks.getSubTasks(key); }
  createSubTask(parentKey: string, summary: string, description: string)       { return this.subtasks.createSubTask(parentKey, summary, description); }

  // Agile
  getAgileBoards(opts?: Parameters<JiraAgileService['getAgileBoards']>[0])     { return this.agile.getAgileBoards(opts); }
  getBoardIssues(boardId: number, opts?: Parameters<JiraAgileService['getBoardIssues']>[1]) { return this.agile.getBoardIssues(boardId, opts); }
  getSprints(boardId: number, state?: string)                                  { return this.agile.getSprints(boardId, state); }
  getSprintIssues(sprintId: number, opts?: Parameters<JiraAgileService['getSprintIssues']>[1]) { return this.agile.getSprintIssues(sprintId, opts); }
  moveIssuesToSprint(sprintId: number, issueKeys: string[])                    { return this.agile.moveIssuesToSprint(sprintId, issueKeys); }
  createSprint(boardId: number, name: string, opts?: Parameters<JiraAgileService['createSprint']>[2]) { return this.agile.createSprint(boardId, name, opts); }
  updateSprint(sprintId: number, updates: Parameters<JiraAgileService['updateSprint']>[1])  { return this.agile.updateSprint(sprintId, updates); }

  // Versions
  getProjectVersions(projectKey: string)                                       { return this.versions.getProjectVersions(projectKey); }
  createVersion(projectKey: string, name: string, opts?: Parameters<JiraVersionService['createVersion']>[2]) { return this.versions.createVersion(projectKey, name, opts); }
  updateVersion(versionId: string, updates: Parameters<JiraVersionService['updateVersion']>[1]) { return this.versions.updateVersion(versionId, updates); }

  // Metadata
  getProjects()                                                                { return this.metadata.getProjects(); }
  getIssueTypes(projectKey: string)                                            { return this.metadata.getIssueTypes(projectKey); }
  getFields(type?: 'standard' | 'custom', query?: string)                     { return this.metadata.getFields(type, query); }
  getUsersByQuery(query: string)                                               { return this.metadata.getUsersByQuery(query); }
}
