import { AtlassianClient } from '../atlassian-client.js';
import { JiraIssue, SearchOptions } from '../types.js';

export class JiraService {
  private client: AtlassianClient;

  constructor() {
    this.client = new AtlassianClient();
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
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
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
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
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
    issueType: string = 'Task'
  ): Promise<JiraIssue> {
    const data = {
      fields: {
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
      }
    };

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

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    const data = {
      transition: { id: transitionId }
    };

    await this.client.post(`/rest/api/3/issue/${issueKey}/transitions`, data);
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
}