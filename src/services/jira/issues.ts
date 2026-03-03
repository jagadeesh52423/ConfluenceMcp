import { JiraIssue, SearchOptions } from '../../types.js';
import { JiraBaseService } from './base.js';

export class JiraIssueService extends JiraBaseService {

  async searchIssues(options: SearchOptions = {}): Promise<JiraIssue[]> {
    const { query, assignee, status, project, labels, reporter, createdAfter, updatedAfter, jql: rawJql, fields: extraFields, limit = 50, startAt = 0 } = options;

    let jql: string;

    if (rawJql) {
      jql = rawJql;
    } else {
      const conditions: string[] = [];
      if (query) conditions.push(`text ~ "${query}"`);
      if (assignee) conditions.push(`assignee = ${assignee}`);
      if (status) conditions.push(`status = "${status}"`);
      if (project) conditions.push(`project = "${project}"`);
      if (labels && labels.length > 0) conditions.push(labels.map(l => `labels = "${l}"`).join(' AND '));
      if (reporter) conditions.push(`reporter = ${reporter}`);
      if (createdAfter) {
        const dateValue = /^\d+d$/.test(createdAfter) ? `-${createdAfter}` : createdAfter;
        conditions.push(`created >= "${dateValue}"`);
      }
      if (updatedAfter) {
        const dateValue = /^\d+d$/.test(updatedAfter) ? `-${updatedAfter}` : updatedAfter;
        conditions.push(`updated >= "${dateValue}"`);
      }
      if (conditions.length === 0) conditions.push('created >= -90d');
      jql = `${conditions.join(' AND ')} ORDER BY updated DESC`;
    }

    const defaultFields = ['summary', 'description', 'status', 'assignee', 'labels', 'created', 'updated'];
    const requestFields = extraFields && extraFields.length > 0 ? [...new Set(extraFields)] : defaultFields;

    const params = { jql, maxResults: limit, startAt, fields: requestFields.join(',') };
    const response = await this.client.get<any>('/rest/api/3/search/jql', params);

    return response.issues.map((issue: any) => {
      const result: any = { key: issue.key };
      for (const field of requestFields) {
        const value = issue.fields[field];
        if (value === undefined || value === null) {
          result[field] = null;
        } else if (field === 'description') {
          result[field] = this.extractText(value);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          result[field] = value.name || value.displayName || value.value || value;
        } else if (Array.isArray(value)) {
          result[field] = value.map((v: any) =>
            typeof v === 'object' ? (v.name || v.displayName || v.value || v) : v
          );
        } else {
          result[field] = value;
        }
      }
      return result;
    });
  }

  async getIssue(issueKey: string, fields?: string[]): Promise<any> {
    const defaultFields = ['summary', 'description', 'status', 'assignee', 'labels', 'created', 'updated'];
    const requestFields = fields && fields.length > 0 ? [...new Set(fields)] : defaultFields;
    const issue = await this.client.get<any>(`/rest/api/3/issue/${issueKey}`, { fields: requestFields.join(',') });

    const result: any = { id: issue.id, key: issue.key };
    for (const field of requestFields) {
      const value = issue.fields[field];
      if (value === undefined || value === null) {
        result[field] = null;
      } else if (field === 'description') {
        result[field] = this.extractText(value);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        result[field] = value.name || value.displayName || value.value || value;
      } else if (Array.isArray(value)) {
        result[field] = value.map((v: any) =>
          typeof v === 'object' ? (v.name || v.displayName || v.value || v) : v
        );
      } else {
        result[field] = value;
      }
    }
    return result;
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
      description: this.toADF(description),
      issuetype: { name: issueType },
    };

    if (additionalFields) {
      if (additionalFields.duedate) fields.duedate = additionalFields.duedate;
      if (additionalFields.priority) fields.priority = { name: additionalFields.priority };
      if (additionalFields.labels && additionalFields.labels.length > 0) fields.labels = additionalFields.labels;
      if (additionalFields.components && additionalFields.components.length > 0) {
        fields.components = additionalFields.components.map(name => ({ name }));
      }
      if (additionalFields.assignee) fields.assignee = { accountId: additionalFields.assignee };
      if (additionalFields.customFields) Object.assign(fields, additionalFields.customFields);
    }

    const response = await this.client.post<any>('/rest/api/3/issue', { fields });
    return this.getIssue(response.key);
  }

  async updateIssue(
    issueKey: string,
    fields: { summary?: string; description?: string; assignee?: string; customFields?: Record<string, any> }
  ): Promise<JiraIssue> {
    const updateFields: any = {};
    if (fields.summary) updateFields.summary = fields.summary;
    if (fields.description) updateFields.description = this.toADF(fields.description);
    if (fields.assignee) updateFields.assignee = { accountId: fields.assignee };
    if (fields.customFields) {
      for (const [key, value] of Object.entries(fields.customFields)) {
        updateFields[key] = value;
      }
    }
    await this.client.put(`/rest/api/3/issue/${issueKey}`, { fields: updateFields });
    return this.getIssue(issueKey);
  }

  async deleteIssue(issueKey: string, deleteSubtasks: boolean = false): Promise<void> {
    const query = deleteSubtasks ? '?deleteSubtasks=true' : '';
    await this.client.delete(`/rest/api/3/issue/${issueKey}${query}`);
  }

  async assignIssue(issueKey: string, accountId: string): Promise<void> {
    await this.client.put(`/rest/api/3/issue/${issueKey}/assignee`, { accountId });
  }

  async batchCreateIssues(issues: Array<{ projectKey: string; summary: string; description: string; issueType?: string; additionalFields?: Record<string, any> }>): Promise<any> {
    if (issues.length > 50) throw new Error('Batch create supports a maximum of 50 issues at a time');
    const issueUpdates = issues.map(issue => ({
      fields: {
        project: { key: issue.projectKey },
        summary: issue.summary,
        description: this.toADF(issue.description),
        issuetype: { name: issue.issueType || 'Task' },
        ...issue.additionalFields,
      },
    }));
    const response = await this.client.post<any>('/rest/api/3/issue/bulk', { issueUpdates });
    return {
      issues: response.issues?.map((i: any) => ({ id: i.id, key: i.key, self: i.self })) || [],
      errors: response.errors || [],
    };
  }

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
        to: item.toString,
      })),
    })) || [];
  }

  async getDevStatus(issueId: string, applicationType?: string, dataType?: string): Promise<any> {
    const params: any = { issueId };
    if (applicationType) params.applicationType = applicationType;
    if (dataType) params.dataType = dataType;
    return this.client.get<any>('/rest/dev-status/latest/issue/detail', params);
  }
}
