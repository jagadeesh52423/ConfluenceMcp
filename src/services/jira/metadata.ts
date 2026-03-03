import { JiraBaseService } from './base.js';

export class JiraMetadataService extends JiraBaseService {

  async getProjects(): Promise<any[]> {
    return this.client.get<any>('/rest/api/3/project');
  }

  async getIssueTypes(projectKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/createmeta/${projectKey}/issuetypes`);
    return response.issueTypes;
  }

  async getFields(type?: 'standard' | 'custom', query?: string): Promise<any[]> {
    const response = await this.client.get<any>('/rest/api/3/field');
    let fields = response.map((f: any) => ({
      id: f.id,
      name: f.name,
      custom: f.custom || false,
      schema: f.schema?.type || null,
    }));
    if (type === 'standard') fields = fields.filter((f: any) => !f.custom);
    else if (type === 'custom') fields = fields.filter((f: any) => f.custom);
    if (query) {
      const q = query.toLowerCase();
      fields = fields.filter((f: any) => f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q));
    }
    return fields.sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  async getUsersByQuery(query: string): Promise<any[]> {
    return this.client.get<any>('/rest/api/3/user/search', { query, maxResults: 10 });
  }
}
