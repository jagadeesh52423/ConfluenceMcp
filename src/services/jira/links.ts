import { JiraBaseService } from './base.js';

export class JiraLinkService extends JiraBaseService {

  async getIssueLinks(issueKey: string): Promise<any[]> {
    const issue = await this.client.get<any>(`/rest/api/3/issue/${issueKey}`, { fields: ['issuelinks'] });
    return issue.fields.issuelinks?.map((link: any) => ({
      id: link.id,
      type: link.type?.name || 'Unknown',
      inward: link.inwardIssue ? {
        key: link.inwardIssue.key,
        summary: link.inwardIssue.fields?.summary,
        status: link.inwardIssue.fields?.status?.name,
      } : null,
      outward: link.outwardIssue ? {
        key: link.outwardIssue.key,
        summary: link.outwardIssue.fields?.summary,
        status: link.outwardIssue.fields?.status?.name,
      } : null,
    })) || [];
  }

  async createIssueLink(inwardIssueKey: string, outwardIssueKey: string, linkType: string): Promise<any> {
    return this.client.post<any>('/rest/api/3/issueLink', {
      type: { name: linkType },
      inwardIssue: { key: inwardIssueKey },
      outwardIssue: { key: outwardIssueKey },
    });
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
      outward: type.outward,
    }));
  }

  async linkToEpic(issueKey: string, epicKey: string): Promise<void> {
    try {
      await this.client.put(`/rest/api/3/issue/${issueKey}`, { fields: { parent: { key: epicKey } } });
    } catch {
      const fields = await this.client.get<any>('/rest/api/3/field');
      const epicLinkField = fields.find((f: any) => f.name === 'Epic Link' || f.clauseNames?.includes('cf[10014]'));
      if (epicLinkField) {
        await this.client.put(`/rest/api/3/issue/${issueKey}`, { fields: { [epicLinkField.id]: epicKey } });
      } else {
        throw new Error('Could not find Epic Link field. Ensure the issue type supports epic linking.');
      }
    }
  }
}
