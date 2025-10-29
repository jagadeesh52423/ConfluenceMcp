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

    // Create bounded JQL query (Jira requires bounded queries now)
    let jql = 'created >= -90d ORDER BY created DESC';
    if (query) {
      jql = `text ~ "${query}" AND created >= -90d ORDER BY created DESC`;
    }

    const params = {
      jql,
      maxResults: limit,
      startAt,
      fields: 'summary,description,status,assignee,created,updated'
    };

    const response = await this.client.get<any>('/rest/api/3/search/jql', params);

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
      description: this.parseDescriptionToADF(description),
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
      updateFields.description = this.parseDescriptionToADF(fields.description);
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
      body: this.parseDescriptionToADF(comment)
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
    if (!body) return '';

    // If body is already a string (wiki markup), return it directly
    if (typeof body === 'string') {
      return this.formatWikiMarkup(body);
    }

    // If body doesn't have content property, it might be wiki markup in another format
    if (!body.content) {
      return this.formatWikiMarkup(String(body));
    }

    let text = '';
    const extractFromContent = (content: any[]): void => {
      for (const item of content) {
        if (item.type === 'text' && item.text) {
          text += item.text;
        } else if (item.type === 'hardBreak') {
          text += '\n';
        } else if (item.type === 'paragraph') {
          if (item.content) {
            extractFromContent(item.content);
          }
        } else if (item.type === 'heading') {
          const level = item.attrs?.level || 1;
          const prefix = '#'.repeat(level);
          text += `${prefix} `;
          if (item.content) {
            extractFromContent(item.content);
          }
        } else if (item.type === 'bulletList' || item.type === 'orderedList') {
          if (item.content) {
            extractFromContent(item.content);
          }
        } else if (item.type === 'listItem') {
          text += '- ';
          if (item.content) {
            extractFromContent(item.content);
          }
        } else if (item.type === 'codeBlock') {
          text += '```';
          if (item.content) {
            extractFromContent(item.content);
          }
          text += '```';
        } else if (item.type === 'table') {
          // Extract table as markdown
          if (item.content) {
            const rows: string[][] = [];
            item.content.forEach((row: any) => {
              if (row.type === 'tableRow' && row.content) {
                const cells: string[] = [];
                row.content.forEach((cell: any) => {
                  if ((cell.type === 'tableCell' || cell.type === 'tableHeader') && cell.content) {
                    let cellText = '';
                    const extractCellText = (cellContent: any[]) => {
                      cellContent.forEach((cellItem: any) => {
                        if (cellItem.type === 'paragraph' && cellItem.content) {
                          cellItem.content.forEach((textItem: any) => {
                            if (textItem.type === 'text' && textItem.text) {
                              cellText += textItem.text;
                            }
                          });
                        }
                      });
                    };
                    extractCellText(cell.content);
                    cells.push(cellText.trim());
                  }
                });
                if (cells.length > 0) {
                  rows.push(cells);
                }
              }
            });

            // Format as markdown table
            if (rows.length > 0) {
              const [headerRow, ...dataRows] = rows;

              // Header row
              text += '\n| ' + headerRow.join(' | ') + ' |\n';

              // Separator row
              text += '|' + headerRow.map(() => '--------').join('|') + '|\n';

              // Data rows
              dataRows.forEach(row => {
                text += '| ' + row.join(' | ') + ' |\n';
              });
            }
          }
        } else if (item.content) {
          extractFromContent(item.content);
        }
      }
    };

    extractFromContent(body.content);
    return this.formatWikiMarkup(text.trim());
  }

  private formatWikiMarkup(text: string): string {
    if (!text) return '';

    return text
      // Convert Confluence headers to markdown headers
      .replace(/^h([1-6])\.\s*/gm, (match, level) => '#'.repeat(parseInt(level)) + ' ')
      // Convert horizontal rules
      .replace(/^----+$/gm, '---')
      // Handle panels - convert to blockquotes for better readability
      .replace(/\{panel:title=([^|]*)[^}]*\}/g, '\n> **$1**\n>')
      .replace(/\{panel\}/g, '\n')
      // Handle colored text/backgrounds - keep the text but remove styling
      .replace(/\{color:[^}]*\}([^{]*)\{color\}/g, '$1')
      // Convert checkboxes
      .replace(/☐/g, '- [ ]')
      .replace(/☑/g, '- [x]')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Ensure proper spacing around headers
      .replace(/\n(#{1,6}\s)/g, '\n\n$1')
      .trim();
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
      data.comment = this.parseDescriptionToADF(comment);
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
      data.comment = this.parseDescriptionToADF(comment);
    }

    const response = await this.client.put<any>(`/rest/api/3/issue/${issueKey}/worklog/${worklogId}`, data);
    return response;
  }

  async deleteWorkLog(issueKey: string, worklogId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/issue/${issueKey}/worklog/${worklogId}`);
  }

  // Watchers Methods

  async getWatchers(issueKey: string): Promise<any> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/watchers`);

    return {
      watchCount: response.watchCount,
      isWatching: response.isWatching,
      watchers: response.watchers?.map((watcher: any) => ({
        accountId: watcher.accountId,
        displayName: watcher.displayName,
        emailAddress: watcher.emailAddress,
        active: watcher.active
      })) || []
    };
  }

  async addWatcher(issueKey: string, accountId: string): Promise<void> {
    await this.client.post(`/rest/api/3/issue/${issueKey}/watchers`, JSON.stringify(accountId));
  }

  async removeWatcher(issueKey: string, accountId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/issue/${issueKey}/watchers?accountId=${accountId}`);
  }

  // Sub-task Methods

  async getSubTasks(issueKey: string): Promise<any[]> {
    const issue = await this.client.get<any>(`/rest/api/3/issue/${issueKey}`, {
      fields: ['subtasks']
    });

    return issue.fields.subtasks?.map((subtask: any) => ({
      id: subtask.id,
      key: subtask.key,
      summary: subtask.fields?.summary,
      status: subtask.fields?.status?.name,
      assignee: subtask.fields?.assignee?.displayName
    })) || [];
  }

  async createSubTask(parentKey: string, summary: string, description: string): Promise<any> {
    const data = {
      fields: {
        project: { key: parentKey.split('-')[0] },
        parent: { key: parentKey },
        summary,
        description: this.parseDescriptionToADF(description),
        issuetype: { name: 'Sub-task' }
      }
    };

    const response = await this.client.post<any>('/rest/api/3/issue', data);
    return this.getIssue(response.key);
  }

  // Issue History Methods

  async getIssueHistory(issueKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/changelog`);

    return response.values?.map((change: any) => ({
      id: change.id,
      author: change.author?.displayName || 'Unknown',
      authorAccountId: change.author?.accountId,
      created: change.created,
      items: change.items?.map((item: any) => ({
        field: item.field,
        fieldtype: item.fieldtype,
        from: item.fromString,
        to: item.toString
      }))
    })) || [];
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

  // Enhanced description parser that converts text to proper ADF format
  private parseDescriptionToADF(description: string): any {
    const lines = description.split('\n');
    const content: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') {
        // Skip empty lines - let Claude handle spacing naturally
        continue;
      }

      // Handle Confluence wiki markup headers (h1., h2., h3., etc.)
      const confluenceHeaderMatch = line.match(/^h([1-6])\.\s*(.*)$/);
      if (confluenceHeaderMatch) {
        const level = parseInt(confluenceHeaderMatch[1]);
        const headerText = confluenceHeaderMatch[2];
        content.push({
          type: 'heading',
          attrs: { level },
          content: [{
            type: 'text',
            text: headerText
          }]
        });
        continue;
      }

      // Handle markdown headers (## Header, ### Header)
      if (line.startsWith('###')) {
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [{
            type: 'text',
            text: line.substring(3).trim()
          }]
        });
      } else if (line.startsWith('##')) {
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{
            type: 'text',
            text: line.substring(2).trim()
          }]
        });
      } else if (line.startsWith('#')) {
        content.push({
          type: 'heading',
          attrs: { level: 1 },
          content: [{
            type: 'text',
            text: line.substring(1).trim()
          }]
        });
      }
      // Handle horizontal rules (---- or ----)
      else if (/^-{4,}$/.test(line)) {
        content.push({
          type: 'rule'
        });
      }
      // Handle Confluence panels
      else if (line.match(/^\{panel:/)) {
        const panelMatch = line.match(/^\{panel:title=([^|]*)[^}]*\}$/);
        if (panelMatch) {
          const title = panelMatch[1];
          // Start collecting panel content
          const panelContent: any[] = [];
          i++; // Move to next line

          // Collect content until we hit {panel}
          while (i < lines.length && !lines[i].trim().match(/^\{panel\}$/)) {
            const panelLine = lines[i].trim();
            if (panelLine) {
              panelContent.push({
                type: 'paragraph',
                content: this.parseInlineFormatting(panelLine)
              });
            }
            i++;
          }

          // Create panel as an info panel (closest ADF equivalent)
          content.push({
            type: 'panel',
            attrs: { panelType: 'info' },
            content: [
              {
                type: 'paragraph',
                content: [{
                  type: 'text',
                  text: title,
                  marks: [{ type: 'strong' }]
                }]
              },
              ...panelContent
            ]
          });
        }
      }
      // Handle bullet points
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Check if we need to start a new bullet list or continue existing one
        const lastItem = content[content.length - 1];
        const bulletText = line.substring(2).trim();

        if (lastItem && lastItem.type === 'bulletList') {
          lastItem.content.push({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: this.parseInlineFormatting(bulletText)
            }]
          });
        } else {
          content.push({
            type: 'bulletList',
            content: [{
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: this.parseInlineFormatting(bulletText)
              }]
            }]
          });
        }
      }
      // Handle numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^\d+\.\s(.+)$/);
        if (match) {
          const listText = match[1];
          const lastItem = content[content.length - 1];

          if (lastItem && lastItem.type === 'orderedList') {
            lastItem.content.push({
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: this.parseInlineFormatting(listText)
              }]
            });
          } else {
            content.push({
              type: 'orderedList',
              content: [{
                type: 'listItem',
                content: [{
                  type: 'paragraph',
                  content: this.parseInlineFormatting(listText)
                }]
              }]
            });
          }
        }
      }
      // Handle code blocks (```)
      else if (line.startsWith('```')) {
        const codeLines: string[] = [];
        i++; // Skip the opening ```

        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }

        content.push({
          type: 'codeBlock',
          content: [{
            type: 'text',
            text: codeLines.join('\n')
          }]
        });
      }
      // Handle markdown tables - convert to Confluence wiki markup
      else if (line.includes('|') && line.trim() !== '|') {
        // Check if this looks like a markdown table row
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');

        if (cells.length >= 2) {
          // This looks like a table row, start collecting table data
          const tableRows: string[][] = [];
          let currentLine = i;

          // Collect all consecutive table rows
          while (currentLine < lines.length) {
            const tableLine = lines[currentLine].trim();
            if (!tableLine.includes('|') || tableLine === '') break;

            // Skip separator lines (|-----|-----|)
            if (tableLine.match(/^\|?[\s\-:|]+\|?$/)) {
              currentLine++;
              continue;
            }

            const rowCells = tableLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            if (rowCells.length >= 2) {
              tableRows.push(rowCells);
            } else {
              break;
            }
            currentLine++;
          }

          // Keep markdown table format (Jira supports it directly)
          if (tableRows.length > 0) {
            // Reconstruct the original markdown table format
            const tableLines: string[] = [];

            // First, find if we have separator lines in the original
            let hasSeparator = false;
            let separatorIndex = -1;

            // Check the original lines for separator
            for (let checkIdx = i; checkIdx < currentLine; checkIdx++) {
              const checkLine = lines[checkIdx].trim();
              if (checkLine.match(/^\|?[\s\-:|]+\|?$/)) {
                hasSeparator = true;
                separatorIndex = checkIdx - i;
                break;
              }
            }

            // Add header row
            if (tableRows.length > 0) {
              tableLines.push('| ' + tableRows[0].join(' | ') + ' |');
            }

            // Add separator if we had one, or create a simple one
            if (hasSeparator) {
              // Use the original separator format from your working examples
              tableLines.push('|-|-|');
            } else if (tableRows.length > 1) {
              // Create separator for header/data distinction
              tableLines.push('|-|-|');
            }

            // Add data rows (skip first row which is header)
            for (let rowIdx = 1; rowIdx < tableRows.length; rowIdx++) {
              tableLines.push('| ' + tableRows[rowIdx].join(' | ') + ' |');
            }

            const markdownTable = tableLines.join('\n');

            // Add as paragraph containing the markdown table
            content.push({
              type: 'paragraph',
              content: [{
                type: 'text',
                text: markdownTable
              }]
            });

            // Skip the lines we've processed
            i = currentLine - 1; // -1 because the for loop will increment
            continue;
          }
        }

        // If we reach here, it's not a valid table, treat as regular paragraph
        content.push({
          type: 'paragraph',
          content: this.parseInlineFormatting(line)
        });
      }
      // Regular paragraph
      else {
        content.push({
          type: 'paragraph',
          content: this.parseInlineFormatting(line)
        });
      }
    }

    // If no content was parsed, add a simple paragraph
    if (content.length === 0) {
      content.push({
        type: 'paragraph',
        content: [{
          type: 'text',
          text: description || ''
        }]
      });
    }

    return {
      type: 'doc',
      version: 1,
      content
    };
  }

  // Parse inline formatting like **bold**, *italic*, `code`, emojis
  private parseInlineFormatting(text: string): any[] {
    const result: any[] = [];
    let currentPos = 0;

    // Process patterns in order of precedence to avoid conflicts
    // **bold** should be processed before *italic* to handle **text** correctly
    const patterns = [
      { regex: /\*\*(.*?)\*\*/g, type: 'strong' },    // **bold** (process first)
      { regex: /`([^`]+?)`/g, type: 'code' },         // `code`
    ];

    let matches: any[] = [];

    // Find all formatting matches
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, 'g');
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[1],
          type: pattern.type,
          fullMatch: match[0]
        });
      }
    });

    // Sort matches by position and remove overlapping matches
    matches.sort((a, b) => a.start - b.start);

    // After processing bold and code, handle italic patterns that don't overlap
    let tempText = text;
    // Remove already matched bold and code patterns from consideration
    matches.forEach(match => {
      tempText = tempText.substring(0, match.start) + ' '.repeat(match.end - match.start) + tempText.substring(match.end);
    });

    // Now find italic patterns in the remaining text
    const italicRegex = /\*([^*]+?)\*/g;
    let italicMatch;
    while ((italicMatch = italicRegex.exec(tempText)) !== null) {
      matches.push({
        start: italicMatch.index,
        end: italicMatch.index + italicMatch[0].length,
        text: italicMatch[1],
        type: 'em',
        fullMatch: italicMatch[0]
      });
    }

    // Sort matches by position and remove overlapping matches
    matches.sort((a, b) => a.start - b.start);

    // Filter out overlapping matches (keep the first one in case of conflict)
    const filteredMatches: any[] = [];
    for (const match of matches) {
      const isOverlapping = filteredMatches.some(existing =>
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end) ||
        (match.start <= existing.start && match.end >= existing.end)
      );

      if (!isOverlapping) {
        filteredMatches.push(match);
      }
    }

    // Sort filtered matches by position for proper processing
    filteredMatches.sort((a, b) => a.start - b.start);

    // Process text with formatting
    filteredMatches.forEach(match => {
      // Add text before the match
      if (match.start > currentPos) {
        const beforeText = text.substring(currentPos, match.start);
        if (beforeText) {
          result.push({
            type: 'text',
            text: beforeText
          });
        }
      }

      // Add formatted text
      result.push({
        type: 'text',
        text: match.text,
        marks: [{ type: match.type }]
      });

      currentPos = match.end;
    });

    // Add remaining text
    if (currentPos < text.length) {
      const remainingText = text.substring(currentPos);
      if (remainingText) {
        result.push({
          type: 'text',
          text: remainingText
        });
      }
    }

    // If no formatting was found, return simple text
    if (result.length === 0) {
      result.push({
        type: 'text',
        text: text
      });
    }

    return result;
  }
}