import { JiraService } from '../services/jira.js';
import {
  ToolResponse,
  successResponse,
  jsonResponse,
  errorResponse,
  ERROR_TIPS,
  formatHelpers,
} from '../error-handler.js';
import { ICONS } from '../constants.js';

/**
 * Jira tool handlers
 */
export class JiraHandlers {
  constructor(private service: JiraService) {}

  async searchIssues(args: {
    query?: string;
    assignee?: string;
    status?: string;
    project?: string;
    labels?: string[];
    reporter?: string;
    createdAfter?: string;
    updatedAfter?: string;
    jql?: string;
    fields?: string[];
    limit?: number;
  }): Promise<ToolResponse> {
    const { query, assignee, status, project, labels, reporter, createdAfter, updatedAfter, jql, fields, limit } = args;
    try {
      const issues = await this.service.searchIssues({ query, assignee, status, project, labels, reporter, createdAfter, updatedAfter, jql, fields, limit });
      return jsonResponse(issues);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to search Jira issues',
        params: { Query: query || 'none', Assignee: assignee || 'none', JQL: jql || 'none', Limit: limit || 50 },
        tip: ERROR_TIPS.JIRA_SEARCH,
      });
    }
  }

  async getIssue(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const issue = await this.service.getIssue(issueKey);
      return jsonResponse(issue);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get Jira issue',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async createIssue(args: {
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
  }): Promise<ToolResponse> {
    const { projectKey, summary, description, issueType, duedate, priority, labels, components, assignee, customFields } = args;
    try {
      const additionalFields = { duedate, priority, labels, components, assignee, customFields };
      const issue = await this.service.createIssue(projectKey, summary, description, issueType, additionalFields);

      const optionalFields: string[] = [];
      if (duedate) optionalFields.push(`${ICONS.DATE} **Due Date:** ${duedate}`);
      if (priority) optionalFields.push(`${ICONS.PRIORITY} **Priority:** ${priority}`);
      if (labels && labels.length > 0) optionalFields.push(`${ICONS.LABELS} **Labels:** ${labels.join(', ')}`);
      if (components && components.length > 0) optionalFields.push(`${ICONS.COMPONENTS} **Components:** ${components.join(', ')}`);
      if (assignee) optionalFields.push(`${ICONS.ASSIGNEE} **Assignee:** ${issue.assignee || assignee}`);

      const optionalFieldsText = optionalFields.length > 0 ? `\n\n${optionalFields.join('\n')}` : '';
      const domain = process.env.JIRA_DOMAIN || process.env.ATLASSIAN_DOMAIN || 'your-domain.atlassian.net';

      return successResponse(
        `${ICONS.SUCCESS} **Jira Issue Created Successfully**\n\n` +
        `${ICONS.TICKET} **Issue Key:** ${issue.key}\n` +
        `${ICONS.SUMMARY} **Summary:** ${issue.summary}\n` +
        `📋 **Issue Type:** ${issueType || 'Task'}\n` +
        `${ICONS.STATUS} **Status:** ${issue.status}\n` +
        `${ICONS.DATE} **Created:** ${new Date(issue.created).toLocaleString()}${optionalFieldsText}\n\n` +
        `${ICONS.DESCRIPTION} **Description:** Successfully created with provided content\n\n` +
        `${ICONS.LINK} **Issue URL:** [View Issue](https://${domain}/browse/${issue.key})`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to create Jira issue',
        params: {
          Project: projectKey,
          Summary: summary,
          'Issue Type': issueType || 'Task',
          'Due Date': duedate || 'none',
          Priority: priority || 'none',
          Labels: labels?.join(', ') || 'none',
          Components: components?.join(', ') || 'none',
          Assignee: assignee || 'none',
        },
        tip: ERROR_TIPS.JIRA_ISSUE_CREATE + ' For custom fields, ensure field IDs are correct.',
      });
    }
  }

  async updateIssue(args: {
    issueKey: string;
    summary?: string;
    description?: string;
    assignee?: string;
  }): Promise<ToolResponse> {
    const { issueKey, summary, description, assignee } = args;
    try {
      const issue = await this.service.updateIssue(issueKey, { summary, description, assignee });

      const updatedFields: string[] = [];
      if (summary) updatedFields.push(`${ICONS.SUMMARY} **Summary:** Updated to "${issue.summary}"`);
      if (description) updatedFields.push(`${ICONS.DESCRIPTION} **Description:** Updated successfully`);
      if (assignee) updatedFields.push(`${ICONS.ASSIGNEE} **Assignee:** ${issue.assignee || assignee}`);

      const updatedFieldsText = updatedFields.length > 0 ? `\n\n**Updated Fields:**\n${updatedFields.join('\n')}` : '';
      const domain = process.env.JIRA_DOMAIN || process.env.ATLASSIAN_DOMAIN || 'your-domain.atlassian.net';

      return successResponse(
        `${ICONS.SUCCESS} **Jira Issue Updated Successfully**\n\n` +
        `${ICONS.TICKET} **Issue Key:** ${issue.key}\n` +
        `${ICONS.STATUS} **Current Status:** ${issue.status}\n` +
        `${ICONS.DATE} **Last Updated:** ${new Date(issue.updated).toLocaleString()}${updatedFieldsText}\n\n` +
        `${ICONS.LINK} **Issue URL:** [View Issue](https://${domain}/browse/${issue.key})`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to update Jira issue ${issueKey}`,
        params: {
          Summary: summary || 'unchanged',
          Description: description || 'unchanged',
          Assignee: assignee || 'unchanged',
        },
        tip: ERROR_TIPS.JIRA_ISSUE_EDIT,
      });
    }
  }

  async addComment(args: { issueKey: string; comment: string }): Promise<ToolResponse> {
    const { issueKey, comment } = args;
    try {
      await this.service.addComment(issueKey, comment);
      return successResponse(`Comment added to issue ${issueKey}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to add comment to Jira issue',
        params: { 'Issue Key': issueKey, Comment: comment.substring(0, 100) + '...' },
        tip: ERROR_TIPS.JIRA_COMMENT,
      });
    }
  }

  async getComments(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const comments = await this.service.getComments(issueKey);
      return jsonResponse(comments);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get comments for Jira issue',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async updateComment(args: { issueKey: string; commentId: string; comment: string }): Promise<ToolResponse> {
    const { issueKey, commentId, comment } = args;
    try {
      const result = await this.service.updateComment(issueKey, commentId, comment);
      return successResponse(
        `${ICONS.SUCCESS} Comment ${commentId} updated successfully on issue ${issueKey}\n\n${JSON.stringify(result, null, 2)}`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to update comment on Jira issue',
        params: { 'Issue Key': issueKey, 'Comment ID': commentId },
        tip: 'Check if the comment exists, you are the author, and you have permission to edit it.',
      });
    }
  }

  async deleteComment(args: { issueKey: string; commentId: string }): Promise<ToolResponse> {
    const { issueKey, commentId } = args;
    try {
      await this.service.deleteComment(issueKey, commentId);
      return successResponse(`${ICONS.SUCCESS} Comment ${commentId} deleted successfully from issue ${issueKey}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to delete comment from Jira issue',
        params: { 'Issue Key': issueKey, 'Comment ID': commentId },
        tip: 'Check if the comment exists and you have permission to delete it.',
      });
    }
  }

  async getProjects(): Promise<ToolResponse> {
    try {
      const projects = await this.service.getProjects();
      return jsonResponse(projects);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get Jira projects',
        tip: 'Check your Jira permissions and API access.',
      });
    }
  }

  async getIssueTransitions(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const transitions = await this.service.getIssueTransitions(issueKey);
      const transitionInfo = transitions.map((t: any) => ({
        id: t.id,
        name: t.name,
        to: t.to?.name || 'Unknown status',
      }));

      return successResponse(
        `Available transitions for ${issueKey}:\n\n` +
        `${transitionInfo.map((t: any) => `• **${t.name}** (ID: ${t.id}) → ${t.to}`).join('\n')}\n\n` +
        `Use the transition ID with jira_transition_issue_interactive for smart field handling.`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get transitions for Jira issue',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async transitionIssue(args: {
    issueKey: string;
    transitionId: string;
    fieldValues?: Record<string, any>;
  }): Promise<ToolResponse> {
    const { issueKey, transitionId, fieldValues } = args;
    try {
      const result = await this.service.transitionIssue(issueKey, transitionId, fieldValues);

      if (result.success) {
        return successResponse(result.message || `Issue ${issueKey} transitioned successfully`);
      } else if (result.requiresInput && result.requiredFields) {
        const fieldInfo = result.requiredFields.map((field: any) => {
          let info = `• **${field.name}** (${field.key})`;
          if (field.options) {
            info += `\n  Options: ${field.options.map((opt: any) => `${opt.value} (${opt.id})`).join(', ')}`;
          }
          if (field.suggestion) {
            info += `\n  ${ICONS.SUGGESTION} Suggestion: "${field.suggestion.value}" - ${field.suggestion.reason}`;
          }
          return info;
        }).join('\n\n');

        return successResponse(
          `${result.message}\n\n**Required Fields:**\n${fieldInfo}\n\n` +
          `**Next Steps:**\nUse jira_transition_issue_interactive for automatic field suggestion, or provide fieldValues with the correct field IDs and values.`
        );
      } else {
        return {
          content: [{ type: 'text', text: result.message || 'Transition failed with unknown error' }],
          isError: true,
        };
      }
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to transition Jira issue ${issueKey}`,
        params: {
          'Transition ID': transitionId,
          'Field Values': JSON.stringify(fieldValues || {}, null, 2),
        },
        tip: ERROR_TIPS.JIRA_TRANSITION,
      });
    }
  }

  async transitionIssueInteractive(args: {
    issueKey: string;
    transitionId: string;
    fieldValues?: Record<string, any>;
  }): Promise<ToolResponse> {
    const { issueKey, transitionId, fieldValues } = args;
    try {
      const result = await this.service.transitionIssueInteractive(issueKey, transitionId, fieldValues);

      if (result.success) {
        return successResponse(result.message || `Issue ${issueKey} transitioned successfully`);
      } else if (result.requiresInput && result.requiredFields) {
        const fieldInfo = result.requiredFields.map((field: any) => {
          let info = `• **${field.name}** (${field.key})`;
          if (field.options) {
            info += `\n  Options: ${field.options.map((opt: any) => `${opt.value} (${opt.id})`).join(', ')}`;
          }
          if (field.suggestion) {
            info += `\n  ${ICONS.SUGGESTION} Suggestion: "${field.suggestion.value}" - ${field.suggestion.reason}`;
          }
          return info;
        }).join('\n\n');

        return successResponse(`${result.message}\n\n**Fields still requiring input:**\n${fieldInfo}`);
      } else {
        return {
          content: [{ type: 'text', text: result.message || 'Transition failed with unknown error' }],
          isError: true,
        };
      }
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to transition Jira issue ${issueKey} (interactive mode)`,
        params: {
          'Transition ID': transitionId,
          'Field Values': JSON.stringify(fieldValues || {}, null, 2),
        },
        tip: ERROR_TIPS.JIRA_TRANSITION,
      });
    }
  }

  async getAttachments(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const attachments = await this.service.getAttachments(issueKey);
      return jsonResponse(attachments);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get attachments for Jira issue',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async addAttachment(args: { issueKey: string; filename: string; fileContent: string }): Promise<ToolResponse> {
    const { issueKey, filename, fileContent } = args;
    try {
      const result = await this.service.addAttachment(issueKey, filename, fileContent);
      return successResponse(`Attachment "${filename}" added to issue ${issueKey}\n\n${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to add attachment to Jira issue',
        params: { 'Issue Key': issueKey, Filename: filename },
        tip: ERROR_TIPS.JIRA_ATTACHMENT,
      });
    }
  }

  async deleteAttachment(args: { attachmentId: string }): Promise<ToolResponse> {
    const { attachmentId } = args;
    try {
      await this.service.deleteAttachment(attachmentId);
      return successResponse(`Attachment ${attachmentId} deleted successfully`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to delete attachment',
        params: { 'Attachment ID': attachmentId },
        tip: 'Check if the attachment exists and you have permission to delete it.',
      });
    }
  }

  async getIssueLinks(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const links = await this.service.getIssueLinks(issueKey);
      return jsonResponse(links);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get issue links',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async createIssueLink(args: { inwardIssueKey: string; outwardIssueKey: string; linkType: string }): Promise<ToolResponse> {
    const { inwardIssueKey, outwardIssueKey, linkType } = args;
    try {
      await this.service.createIssueLink(inwardIssueKey, outwardIssueKey, linkType);
      return successResponse(`Link created: ${inwardIssueKey} ${linkType} ${outwardIssueKey}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to create issue link',
        params: { 'Inward Issue': inwardIssueKey, 'Outward Issue': outwardIssueKey, 'Link Type': linkType },
        tip: ERROR_TIPS.JIRA_LINK,
      });
    }
  }

  async deleteIssueLink(args: { linkId: string }): Promise<ToolResponse> {
    const { linkId } = args;
    try {
      await this.service.deleteIssueLink(linkId);
      return successResponse(`Issue link ${linkId} deleted successfully`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to delete issue link',
        params: { 'Link ID': linkId },
        tip: 'Check if the link exists and you have permission to delete it. Use jira_get_issue_links to get link IDs.',
      });
    }
  }

  async getLinkTypes(): Promise<ToolResponse> {
    try {
      const linkTypes = await this.service.getIssueLinkTypes();
      return jsonResponse(linkTypes);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get issue link types',
        tip: 'Check your Jira permissions and API access.',
      });
    }
  }

  async getWorklogs(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const worklogs = await this.service.getWorkLogs(issueKey);
      return jsonResponse(worklogs);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get work logs',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async addWorklog(args: { issueKey: string; timeSpentSeconds: number; comment?: string; started?: string }): Promise<ToolResponse> {
    const { issueKey, timeSpentSeconds, comment, started } = args;
    try {
      const result = await this.service.addWorkLog(issueKey, timeSpentSeconds, comment, started);
      const hours = Math.floor(timeSpentSeconds / 3600);
      const minutes = Math.floor((timeSpentSeconds % 3600) / 60);
      return successResponse(
        `Work log added to ${issueKey}\nTime spent: ${hours}h ${minutes}m\n\n${JSON.stringify(result, null, 2)}`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to add work log',
        params: { 'Issue Key': issueKey, 'Time Spent': `${timeSpentSeconds}s`, Comment: comment || 'none' },
        tip: ERROR_TIPS.JIRA_WORKLOG,
      });
    }
  }

  async updateWorklog(args: { issueKey: string; worklogId: string; timeSpentSeconds?: number; comment?: string }): Promise<ToolResponse> {
    const { issueKey, worklogId, timeSpentSeconds, comment } = args;
    try {
      const result = await this.service.updateWorkLog(issueKey, worklogId, timeSpentSeconds, comment);
      return successResponse(`Work log ${worklogId} updated\n\n${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to update work log',
        params: { 'Issue Key': issueKey, 'Worklog ID': worklogId },
        tip: ERROR_TIPS.JIRA_WORKLOG,
      });
    }
  }

  async deleteWorklog(args: { issueKey: string; worklogId: string }): Promise<ToolResponse> {
    const { issueKey, worklogId } = args;
    try {
      await this.service.deleteWorkLog(issueKey, worklogId);
      return successResponse(`Work log ${worklogId} deleted from ${issueKey}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to delete work log',
        params: { 'Issue Key': issueKey, 'Worklog ID': worklogId },
        tip: ERROR_TIPS.JIRA_WORKLOG,
      });
    }
  }

  async getWatchers(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const watchers = await this.service.getWatchers(issueKey);
      return jsonResponse(watchers);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get watchers',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async addWatcher(args: { issueKey: string; accountId: string }): Promise<ToolResponse> {
    const { issueKey, accountId } = args;
    try {
      await this.service.addWatcher(issueKey, accountId);
      return successResponse(`Watcher added to ${issueKey}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to add watcher',
        params: { 'Issue Key': issueKey, 'Account ID': accountId },
        tip: ERROR_TIPS.JIRA_WATCHER,
      });
    }
  }

  async removeWatcher(args: { issueKey: string; accountId: string }): Promise<ToolResponse> {
    const { issueKey, accountId } = args;
    try {
      await this.service.removeWatcher(issueKey, accountId);
      return successResponse(`Watcher removed from ${issueKey}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to remove watcher',
        params: { 'Issue Key': issueKey, 'Account ID': accountId },
        tip: 'Check if the issue exists and you have permission to remove watchers.',
      });
    }
  }

  async getSubtasks(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const subtasks = await this.service.getSubTasks(issueKey);
      return jsonResponse(subtasks);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get sub-tasks',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async createSubtask(args: { parentKey: string; summary: string; description: string }): Promise<ToolResponse> {
    const { parentKey, summary, description } = args;
    try {
      const subtask = await this.service.createSubTask(parentKey, summary, description);
      return successResponse(`Sub-task created: ${subtask.key}\n\n${JSON.stringify(subtask, null, 2)}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to create sub-task',
        params: { 'Parent Key': parentKey, Summary: summary },
        tip: ERROR_TIPS.JIRA_SUBTASK,
      });
    }
  }

  async getIssueHistory(args: { issueKey: string }): Promise<ToolResponse> {
    const { issueKey } = args;
    try {
      const history = await this.service.getIssueHistory(issueKey);
      return jsonResponse(history);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get issue history',
        params: { 'Issue Key': issueKey },
        tip: ERROR_TIPS.JIRA_ISSUE_VIEW,
      });
    }
  }

  async getFields(args: { type?: string }): Promise<ToolResponse> {
    const { type } = args;
    try {
      const filterType = (type === 'standard' || type === 'custom') ? type : undefined;
      const fields = await this.service.getFields(filterType);
      return jsonResponse(fields);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get Jira fields',
        tip: 'Check your Jira permissions and API access.',
      });
    }
  }

  async getLabels(args: { query?: string; maxResults?: number }): Promise<ToolResponse> {
    const { query, maxResults } = args;
    try {
      const labels = await this.service.getLabels(query, maxResults);
      return jsonResponse(labels);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get labels',
        params: { Query: query || 'none', 'Max Results': maxResults || 50 },
        tip: 'Check your Jira permissions and API access.',
      });
    }
  }

  async addLabels(args: { issueKey: string; labels: string[] }): Promise<ToolResponse> {
    const { issueKey, labels } = args;
    try {
      await this.service.addLabels(issueKey, labels);
      return successResponse(
        `${ICONS.SUCCESS} Labels added to ${issueKey}\n\n` +
        `${ICONS.LABELS} **Added:** ${labels.join(', ')}`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to add labels to ${issueKey}`,
        params: { 'Issue Key': issueKey, Labels: labels.join(', ') },
        tip: ERROR_TIPS.JIRA_ISSUE_EDIT,
      });
    }
  }

  async removeLabels(args: { issueKey: string; labels: string[] }): Promise<ToolResponse> {
    const { issueKey, labels } = args;
    try {
      await this.service.removeLabels(issueKey, labels);
      return successResponse(
        `${ICONS.SUCCESS} Labels removed from ${issueKey}\n\n` +
        `${ICONS.LABELS} **Removed:** ${labels.join(', ')}`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to remove labels from ${issueKey}`,
        params: { 'Issue Key': issueKey, Labels: labels.join(', ') },
        tip: ERROR_TIPS.JIRA_ISSUE_EDIT,
      });
    }
  }

  async getAgileBoards(args: { name?: string; type?: string; projectKeyOrId?: string }): Promise<ToolResponse> {
    try {
      const boards = await this.service.getAgileBoards(args);
      return jsonResponse(boards);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get agile boards',
        params: { Name: args.name || 'all', Type: args.type || 'all', Project: args.projectKeyOrId || 'all' },
        tip: ERROR_TIPS.JIRA_AGILE,
      });
    }
  }

  async getBoardIssues(args: { boardId: number; jql?: string; maxResults?: number; startAt?: number }): Promise<ToolResponse> {
    const { boardId, jql, maxResults, startAt } = args;
    try {
      const result = await this.service.getBoardIssues(boardId, { jql, maxResults, startAt });
      return jsonResponse(result);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get board issues',
        params: { 'Board ID': boardId, JQL: jql || 'none' },
        tip: ERROR_TIPS.JIRA_AGILE,
      });
    }
  }

  async getSprints(args: { boardId: number; state?: string }): Promise<ToolResponse> {
    const { boardId, state } = args;
    try {
      const sprints = await this.service.getSprints(boardId, state);
      return jsonResponse(sprints);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get sprints',
        params: { 'Board ID': boardId, State: state || 'all' },
        tip: ERROR_TIPS.JIRA_AGILE,
      });
    }
  }

  async getSprintIssues(args: { sprintId: number; jql?: string; maxResults?: number; startAt?: number }): Promise<ToolResponse> {
    const { sprintId, jql, maxResults, startAt } = args;
    try {
      const result = await this.service.getSprintIssues(sprintId, { jql, maxResults, startAt });
      return jsonResponse(result);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get sprint issues',
        params: { 'Sprint ID': sprintId, JQL: jql || 'none' },
        tip: ERROR_TIPS.JIRA_AGILE,
      });
    }
  }

  async batchCreateIssues(args: { issues: Array<{ projectKey: string; summary: string; description: string; issueType?: string; additionalFields?: Record<string, any> }> }): Promise<ToolResponse> {
    const { issues } = args;
    try {
      const result = await this.service.batchCreateIssues(issues);
      const successCount = result.issues?.length || 0;
      const errorCount = result.errors?.length || 0;
      return successResponse(
        `${ICONS.SUCCESS} Batch create completed: ${successCount} created, ${errorCount} errors\n\n${JSON.stringify(result, null, 2)}`
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to batch create issues',
        params: { 'Issue Count': issues.length },
        tip: ERROR_TIPS.JIRA_BATCH,
      });
    }
  }

  async getDevStatus(args: { issueId: string; applicationType?: string; dataType?: string }): Promise<ToolResponse> {
    const { issueId, applicationType, dataType } = args;
    try {
      const result = await this.service.getDevStatus(issueId, applicationType, dataType);
      return jsonResponse(result);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get dev status',
        params: { 'Issue ID': issueId, 'Application Type': applicationType || 'all', 'Data Type': dataType || 'all' },
        tip: ERROR_TIPS.JIRA_DEV_STATUS,
      });
    }
  }

  async deleteIssue(args: { issueKey: string; deleteSubtasks?: boolean }): Promise<ToolResponse> {
    const { issueKey, deleteSubtasks } = args;
    try {
      await this.service.deleteIssue(issueKey, deleteSubtasks);
      return successResponse(
        `${ICONS.SUCCESS} Issue ${issueKey} deleted successfully` +
        (deleteSubtasks ? ' (including subtasks)' : '')
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to delete issue ${issueKey}`,
        params: { 'Issue Key': issueKey, 'Delete Subtasks': deleteSubtasks || false },
        tip: ERROR_TIPS.JIRA_DELETE,
      });
    }
  }

  async lookupUser(args: { query: string }): Promise<ToolResponse> {
    const { query } = args;
    try {
      const users = await this.service.getUsersByQuery(query);
      return jsonResponse(users.map((u: any) => ({
        accountId: u.accountId,
        displayName: u.displayName,
        emailAddress: u.emailAddress || null,
        active: u.active,
      })));
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to look up user',
        params: { Query: query },
        tip: 'Check your Jira permissions. Search by display name or email address.',
      });
    }
  }

  async getIssueTypes(args: { projectKey: string }): Promise<ToolResponse> {
    const { projectKey } = args;
    try {
      const issueTypes = await this.service.getIssueTypes(projectKey);
      return jsonResponse(issueTypes);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get issue types',
        params: { 'Project Key': projectKey },
        tip: 'Check if the project key exists and you have permission to view it.',
      });
    }
  }

  async createSprint(args: { boardId: number; name: string; startDate?: string; endDate?: string; goal?: string }): Promise<ToolResponse> {
    const { boardId, name, startDate, endDate, goal } = args;
    try {
      const sprint = await this.service.createSprint(boardId, name, { startDate, endDate, goal });
      return successResponse(
        `${ICONS.SUCCESS} Sprint created successfully\n\n` +
        `**ID:** ${sprint.id}\n` +
        `**Name:** ${sprint.name}\n` +
        `**State:** ${sprint.state}\n` +
        (sprint.startDate ? `**Start:** ${sprint.startDate}\n` : '') +
        (sprint.endDate ? `**End:** ${sprint.endDate}\n` : '') +
        (sprint.goal ? `**Goal:** ${sprint.goal}` : '')
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to create sprint',
        params: { 'Board ID': boardId, Name: name },
        tip: ERROR_TIPS.JIRA_AGILE,
      });
    }
  }

  async updateSprint(args: { sprintId: number; name?: string; state?: string; startDate?: string; endDate?: string; goal?: string }): Promise<ToolResponse> {
    const { sprintId, name, state, startDate, endDate, goal } = args;
    try {
      const sprint = await this.service.updateSprint(sprintId, { name, state, startDate, endDate, goal });
      return successResponse(
        `${ICONS.SUCCESS} Sprint ${sprintId} updated successfully\n\n` +
        `**Name:** ${sprint.name}\n` +
        `**State:** ${sprint.state}\n` +
        (sprint.startDate ? `**Start:** ${sprint.startDate}\n` : '') +
        (sprint.endDate ? `**End:** ${sprint.endDate}\n` : '') +
        (sprint.goal ? `**Goal:** ${sprint.goal}` : '')
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to update sprint ${sprintId}`,
        params: { 'Sprint ID': sprintId, Name: name || 'unchanged', State: state || 'unchanged' },
        tip: ERROR_TIPS.JIRA_AGILE,
      });
    }
  }

  async getProjectVersions(args: { projectKey: string }): Promise<ToolResponse> {
    const { projectKey } = args;
    try {
      const versions = await this.service.getProjectVersions(projectKey);
      return jsonResponse(versions);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get project versions',
        params: { 'Project Key': projectKey },
        tip: 'Check if the project key exists and you have permission to view versions.',
      });
    }
  }

  async createVersion(args: { projectKey: string; name: string; description?: string; startDate?: string; releaseDate?: string; released?: boolean }): Promise<ToolResponse> {
    const { projectKey, name, description, startDate, releaseDate, released } = args;
    try {
      const version = await this.service.createVersion(projectKey, name, { description, startDate, releaseDate, released });
      return successResponse(
        `${ICONS.SUCCESS} Version created successfully\n\n` +
        `**ID:** ${version.id}\n` +
        `**Name:** ${version.name}\n` +
        `**Released:** ${version.released}\n` +
        (version.description ? `**Description:** ${version.description}\n` : '') +
        (version.startDate ? `**Start Date:** ${version.startDate}\n` : '') +
        (version.releaseDate ? `**Release Date:** ${version.releaseDate}` : '')
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to create version',
        params: { 'Project Key': projectKey, Name: name },
        tip: 'Check if the project exists and you have permission to manage versions.',
      });
    }
  }

  async updateVersion(args: { versionId: string; name?: string; description?: string; startDate?: string; releaseDate?: string; released?: boolean; archived?: boolean }): Promise<ToolResponse> {
    const { versionId, name, description, startDate, releaseDate, released, archived } = args;
    try {
      const version = await this.service.updateVersion(versionId, { name, description, startDate, releaseDate, released, archived });
      return successResponse(
        `${ICONS.SUCCESS} Version ${versionId} updated successfully\n\n` +
        `**Name:** ${version.name}\n` +
        `**Released:** ${version.released}\n` +
        `**Archived:** ${version.archived}\n` +
        (version.description ? `**Description:** ${version.description}\n` : '') +
        (version.releaseDate ? `**Release Date:** ${version.releaseDate}` : '')
      );
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to update version ${versionId}`,
        params: { 'Version ID': versionId },
        tip: 'Check if the version exists and you have permission to manage versions.',
      });
    }
  }

  async linkToEpic(args: { issueKey: string; epicKey: string }): Promise<ToolResponse> {
    const { issueKey, epicKey } = args;
    try {
      await this.service.linkToEpic(issueKey, epicKey);
      return successResponse(`${ICONS.SUCCESS} Issue ${issueKey} linked to epic ${epicKey}`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: `Failed to link ${issueKey} to epic ${epicKey}`,
        params: { 'Issue Key': issueKey, 'Epic Key': epicKey },
        tip: 'Check that both issues exist, the epic is actually an Epic type, and you have edit permission.',
      });
    }
  }
}
