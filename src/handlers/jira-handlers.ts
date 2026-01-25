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

  async searchIssues(args: { query?: string; limit?: number }): Promise<ToolResponse> {
    const { query, limit } = args;
    try {
      const issues = await this.service.searchIssues({ query, limit });
      return jsonResponse(issues);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to search Jira issues',
        params: { Query: query || 'none', Limit: limit || 50 },
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
}
