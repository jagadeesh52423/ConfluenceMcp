import { JiraBaseService } from './base.js';

export class JiraLabelService extends JiraBaseService {

  async getLabels(query?: string, maxResults: number = 50): Promise<string[]> {
    const params: any = { maxResults };
    if (query) params.query = query;
    const response = await this.client.get<any>('/rest/api/3/label', params);
    return response.values || [];
  }

  async addLabels(issueKey: string, labels: string[]): Promise<void> {
    await this.client.put(`/rest/api/3/issue/${issueKey}`, {
      update: { labels: labels.map(label => ({ add: label })) },
    });
  }

  async removeLabels(issueKey: string, labels: string[]): Promise<void> {
    await this.client.put(`/rest/api/3/issue/${issueKey}`, {
      update: { labels: labels.map(label => ({ remove: label })) },
    });
  }
}
