import { JiraClient } from '../jira-client.js';
import { JiraIssue, SearchOptions, JiraTransitionResponse, JiraRequiredField, JiraFieldSuggestion, FieldSuggestionRule } from '../types.js';

export class JiraService {
  private client: JiraClient;

  // Smart suggestion rules for common field patterns
  private fieldSuggestionRules: FieldSuggestionRule[] = [
    {
      pattern: /db.*script/i,
      defaultValue: 'No',
      contextRules: [
        {
          condition: (issue) => /template|config|notification|mofu/i.test(issue.summary),
          value: 'No',
          reason: 'Template/config changes are typically done via MOFU tool and do not require database scripts'
        }
      ]
    },
    {
      pattern: /test.*case|unit.*test/i,
      defaultValue: 'Yes',
      contextRules: [
        {
          condition: (issue) => /template|notification|config/i.test(issue.summary),
          value: 'No',
          reason: 'Template and configuration changes may not require separate unit test cases'
        }
      ]
    }
  ];

  constructor() {
    this.client = new JiraClient();
  }

  async searchIssues(options: SearchOptions = {}): Promise<JiraIssue[]> {
    const { query, limit = 50, startAt = 0 } = options;

    let jql = 'ORDER BY created DESC';
    if (query) {
      jql = `text ~ "${query}" ORDER BY created DESC`;
    }

    const params = {
      jql,
      maxResults: limit,
      startAt,
      fields: ['summary', 'description', 'status', 'assignee', 'created', 'updated']
    };

    const response = await this.client.get<any>('/rest/api/3/search', params);

    return response.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary || '',
      description: this.extractTextFromADF(issue.fields.description),
      status: issue.fields.status?.name || '',
      assignee: issue.fields.assignee?.displayName || '',
      created: issue.fields.created || '',
      updated: issue.fields.updated || ''
    }));
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    const params = {
      fields: ['summary', 'description', 'status', 'assignee', 'created', 'updated']
    };

    const issue = await this.client.get<any>(`/rest/api/3/issue/${issueKey}`, params);

    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary || '',
      description: this.extractTextFromADF(issue.fields.description),
      status: issue.fields.status?.name || '',
      assignee: issue.fields.assignee?.displayName || '',
      created: issue.fields.created || '',
      updated: issue.fields.updated || ''
    };
  }

  async createIssue(
    projectKey: string,
    summary: string,
    description: string,
    issueType: string = 'Task',
    additionalFields?: {
      duedate?: string;
      priority?: string;
      labels?: string[];
      components?: string[];
      assignee?: string;
      customFields?: Record<string, any>;
    }
  ): Promise<JiraIssue> {
    const fields: any = {
      project: { key: projectKey },
      summary,
      description: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: description
          }]
        }]
      },
      issuetype: { name: issueType }
    };

    // Add optional fields if provided
    if (additionalFields) {
      // Due date (format: YYYY-MM-DD)
      if (additionalFields.duedate) {
        fields.duedate = additionalFields.duedate;
      }

      // Priority (by name)
      if (additionalFields.priority) {
        fields.priority = { name: additionalFields.priority };
      }

      // Labels (array of strings)
      if (additionalFields.labels && additionalFields.labels.length > 0) {
        fields.labels = additionalFields.labels;
      }

      // Components (by name)
      if (additionalFields.components && additionalFields.components.length > 0) {
        fields.components = additionalFields.components.map(name => ({ name }));
      }

      // Assignee (by account ID)
      if (additionalFields.assignee) {
        fields.assignee = { accountId: additionalFields.assignee };
      }

      // Custom fields (merge directly into fields object)
      if (additionalFields.customFields) {
        Object.assign(fields, additionalFields.customFields);
      }
    }

    const data = { fields };

    const response = await this.client.post<any>('/rest/api/3/issue', data);
    return this.getIssue(response.key);
  }

  async updateIssue(
    issueKey: string,
    fields: { summary?: string; description?: string; assignee?: string }
  ): Promise<JiraIssue> {
    const updateFields: any = {};

    if (fields.summary) {
      updateFields.summary = fields.summary;
    }

    if (fields.description) {
      updateFields.description = {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: fields.description
          }]
        }]
      };
    }

    if (fields.assignee) {
      updateFields.assignee = { accountId: fields.assignee };
    }

    const data = { fields: updateFields };
    await this.client.put(`/rest/api/3/issue/${issueKey}`, data);

    return this.getIssue(issueKey);
  }

  async transitionIssue(issueKey: string, transitionId: string, fieldValues?: Record<string, any>): Promise<JiraTransitionResponse> {
    try {
      const data: any = {
        transition: { id: transitionId }
      };

      // Add field values if provided
      if (fieldValues) {
        data.fields = fieldValues;
      }

      await this.client.post(`/rest/api/3/issue/${issueKey}/transitions`, data);

      return {
        success: true,
        message: `Issue ${issueKey} successfully transitioned`
      };
    } catch (error: any) {
      // Check if this is a required field error
      if (error.response?.status === 400) {
        const requiredFields = await this.handleTransitionError(issueKey, transitionId, error);
        if (requiredFields.length > 0) {
          return {
            success: false,
            requiresInput: true,
            requiredFields,
            message: 'Transition requires additional fields. Please provide values for the required fields.',
            issueKey,
            transitionId
          };
        }
      }

      // Re-throw if not a field validation error
      throw error;
    }
  }

  async getIssueTransitions(issueKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/transitions`);
    return response.transitions;
  }

  async addComment(issueKey: string, comment: string): Promise<void> {
    const data = {
      body: {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: comment
          }]
        }]
      }
    };

    await this.client.post(`/rest/api/3/issue/${issueKey}/comment`, data);
  }

  async getComments(issueKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/comment`);

    return response.comments.map((comment: any) => ({
      id: comment.id,
      author: comment.author?.displayName || 'Unknown',
      authorAccountId: comment.author?.accountId,
      body: this.extractTextFromADF(comment.body),
      created: comment.created,
      updated: comment.updated,
      updateAuthor: comment.updateAuthor?.displayName
    }));
  }

  private extractTextFromADF(body: any): string {
    if (!body || !body.content) return '';

    let text = '';
    const extractFromContent = (content: any[]): void => {
      for (const item of content) {
        if (item.type === 'text' && item.text) {
          text += item.text;
        } else if (item.type === 'hardBreak') {
          text += '\n';
        } else if (item.content) {
          extractFromContent(item.content);
        }
        if (item.type === 'paragraph') {
          text += '\n';
        }
      }
    };

    extractFromContent(body.content);
    return text.trim();
  }

  async getProjects(): Promise<any[]> {
    const response = await this.client.get<any>('/rest/api/3/project');
    return response;
  }

  async getIssueTypes(projectKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/createmeta/${projectKey}/issuetypes`);
    return response.issueTypes;
  }

  async assignIssue(issueKey: string, accountId: string): Promise<void> {
    const data = { accountId };
    await this.client.put(`/rest/api/3/issue/${issueKey}/assignee`, data);
  }

  async getUsersByQuery(query: string): Promise<any[]> {
    const params = {
      query,
      maxResults: 10
    };

    const response = await this.client.get<any>('/rest/api/3/user/search', params);
    return response;
  }

  // Attachment Methods

  async getAttachments(issueKey: string): Promise<any[]> {
    const issue = await this.client.get<any>(`/rest/api/3/issue/${issueKey}`, {
      fields: ['attachment']
    });

    return issue.fields.attachment?.map((att: any) => ({
      id: att.id,
      filename: att.filename,
      author: att.author?.displayName || 'Unknown',
      created: att.created,
      size: att.size,
      mimeType: att.mimeType,
      content: att.content
    })) || [];
  }

  async addAttachment(issueKey: string, filename: string, fileContent: string): Promise<any> {
    // Note: fileContent should be base64 encoded
    const FormData = (await import('form-data')).default;
    const form = new FormData();

    const buffer = Buffer.from(fileContent, 'base64');
    form.append('file', buffer, { filename });

    const response = await this.client.postFormData(`/rest/api/3/issue/${issueKey}/attachments`, form);
    return response;
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/attachment/${attachmentId}`);
  }

  // Issue Linking Methods

  async getIssueLinks(issueKey: string): Promise<any[]> {
    const issue = await this.client.get<any>(`/rest/api/3/issue/${issueKey}`, {
      fields: ['issuelinks']
    });

    return issue.fields.issuelinks?.map((link: any) => ({
      id: link.id,
      type: link.type?.name || 'Unknown',
      inward: link.inwardIssue ? {
        key: link.inwardIssue.key,
        summary: link.inwardIssue.fields?.summary,
        status: link.inwardIssue.fields?.status?.name
      } : null,
      outward: link.outwardIssue ? {
        key: link.outwardIssue.key,
        summary: link.outwardIssue.fields?.summary,
        status: link.outwardIssue.fields?.status?.name
      } : null
    })) || [];
  }

  async createIssueLink(inwardIssueKey: string, outwardIssueKey: string, linkType: string): Promise<any> {
    const data = {
      type: { name: linkType },
      inwardIssue: { key: inwardIssueKey },
      outwardIssue: { key: outwardIssueKey }
    };

    const response = await this.client.post<any>('/rest/api/3/issueLink', data);
    return response;
  }

  async deleteIssueLink(linkId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/issueLink/${linkId}`);
  }

  async getIssueLinkTypes(): Promise<any[]> {
    const response = await this.client.get<any>('/rest/api/3/issueLinkType');
    return response.issueLinkTypes.map((type: any) => ({
      id: type.id,
      name: type.name,
      inward: type.inward,
      outward: type.outward
    }));
  }

  // Work Log Methods

  async getWorkLogs(issueKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/worklog`);

    return response.worklogs?.map((worklog: any) => ({
      id: worklog.id,
      author: worklog.author?.displayName || 'Unknown',
      authorAccountId: worklog.author?.accountId,
      comment: this.extractTextFromADF(worklog.comment),
      created: worklog.created,
      updated: worklog.updated,
      started: worklog.started,
      timeSpent: worklog.timeSpent,
      timeSpentSeconds: worklog.timeSpentSeconds
    })) || [];
  }

  async addWorkLog(issueKey: string, timeSpentSeconds: number, comment?: string, started?: string): Promise<any> {
    const data: any = {
      timeSpentSeconds
    };

    if (started) {
      data.started = started;
    }

    if (comment) {
      data.comment = {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: comment
          }]
        }]
      };
    }

    const response = await this.client.post<any>(`/rest/api/3/issue/${issueKey}/worklog`, data);
    return response;
  }

  async updateWorkLog(issueKey: string, worklogId: string, timeSpentSeconds?: number, comment?: string): Promise<any> {
    const data: any = {};

    if (timeSpentSeconds !== undefined) {
      data.timeSpentSeconds = timeSpentSeconds;
    }

    if (comment) {
      data.comment = {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: comment
          }]
        }]
      };
    }

    const response = await this.client.put<any>(`/rest/api/3/issue/${issueKey}/worklog/${worklogId}`, data);
    return response;
  }

  async deleteWorkLog(issueKey: string, worklogId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/issue/${issueKey}/worklog/${worklogId}`);
  }

  // Smart Field Handling Methods

  private async handleTransitionError(issueKey: string, transitionId: string, error: any): Promise<JiraRequiredField[]> {
    try {
      // Get transition metadata with field information
      const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/transitions?expand=transitions.fields`);
      const transition = response.transitions.find((t: any) => t.id === transitionId);

      if (!transition || !transition.fields) {
        return [];
      }

      // Get issue details for context
      const issue = await this.getIssue(issueKey);

      // Analyze required fields and fields that may need values
      const requiredFields: JiraRequiredField[] = [];
      for (const [fieldKey, fieldInfo] of Object.entries(transition.fields) as [string, any][]) {
        // Process all fields that have validation requirements or are commonly needed
        const field = this.analyzeField(fieldKey, fieldInfo, issue);
        requiredFields.push(field);
      }

      return requiredFields;
    } catch (err) {
      console.error('Error analyzing transition fields:', err);
      return [];
    }
  }

  private analyzeField(fieldKey: string, fieldInfo: any, issue: JiraIssue): JiraRequiredField {
    const field: JiraRequiredField = {
      key: fieldKey,
      name: fieldInfo.name || fieldKey,
      type: fieldInfo.schema?.type || 'unknown',
      required: fieldInfo.required || false
    };

    // Extract options for select fields
    if (fieldInfo.allowedValues) {
      field.options = fieldInfo.allowedValues.map((val: any) => ({
        id: val.id,
        value: val.value
      }));
    }

    // Generate smart suggestions
    field.suggestion = this.generateFieldSuggestion(fieldInfo.name, field.options, issue);

    return field;
  }

  private generateFieldSuggestion(fieldName: string, options?: any[], issue?: JiraIssue): JiraFieldSuggestion | undefined {
    if (!fieldName) return undefined;

    // Apply suggestion rules
    for (const rule of this.fieldSuggestionRules) {
      if (rule.pattern.test(fieldName)) {
        // Check context rules first
        if (rule.contextRules && issue) {
          for (const contextRule of rule.contextRules) {
            if (contextRule.condition(issue)) {
              // Find matching option ID if available
              const matchingOption = options?.find(opt => opt.value === contextRule.value);
              return {
                value: contextRule.value,
                id: matchingOption?.id,
                reason: contextRule.reason
              };
            }
          }
        }

        // Fall back to default value
        const matchingOption = options?.find(opt => opt.value === rule.defaultValue);
        return {
          value: rule.defaultValue,
          id: matchingOption?.id,
          reason: `Default suggestion for ${fieldName.toLowerCase()}`
        };
      }
    }

    // Generic suggestions based on field name patterns
    if (options && options.length > 0) {
      if (/required|mandatory|needed/i.test(fieldName)) {
        const yesOption = options.find(opt => /yes|true|required/i.test(opt.value));
        if (yesOption) {
          return {
            value: yesOption.value,
            id: yesOption.id,
            reason: 'Field name suggests this is typically required'
          };
        }
      }

      if (/optional|not.*required|skip/i.test(fieldName)) {
        const noOption = options.find(opt => /no|false|not.*required|skip/i.test(opt.value));
        if (noOption) {
          return {
            value: noOption.value,
            id: noOption.id,
            reason: 'Field name suggests this is typically not required'
          };
        }
      }
    }

    return undefined;
  }

  // Enhanced transition method with smart field handling
  async transitionIssueInteractive(issueKey: string, transitionId: string, providedFields?: Record<string, any>): Promise<JiraTransitionResponse> {
    // First attempt with provided fields
    const result = await this.transitionIssue(issueKey, transitionId, providedFields);

    if (result.success || !result.requiresInput) {
      return result;
    }

    // If user provided fields but still failed, try to auto-fill based on suggestions
    if (result.requiredFields && result.requiredFields.length > 0) {
      const autoFields: Record<string, any> = { ...providedFields };
      let hasAutoSuggestions = false;

      for (const field of result.requiredFields) {
        if (field.suggestion && !autoFields[field.key]) {
          if (field.suggestion.id) {
            autoFields[field.key] = { id: field.suggestion.id };
          } else {
            autoFields[field.key] = field.suggestion.value;
          }
          hasAutoSuggestions = true;
        }
      }

      // Try transition again with auto-filled suggestions
      if (hasAutoSuggestions) {
        const retryResult = await this.transitionIssue(issueKey, transitionId, autoFields);
        if (retryResult.success) {
          retryResult.message = `${retryResult.message} (auto-filled based on smart suggestions)`;
        }
        return retryResult;
      }
    }

    return result;
  }
}