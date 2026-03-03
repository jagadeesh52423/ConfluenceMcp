import { JiraBaseService } from './base.js';

export class JiraWorklogService extends JiraBaseService {

  async getWorkLogs(issueKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/worklog`);
    return response.worklogs?.map((worklog: any) => ({
      id: worklog.id,
      author: worklog.author?.displayName || 'Unknown',
      authorAccountId: worklog.author?.accountId,
      comment: this.extractText(worklog.comment),
      created: worklog.created,
      updated: worklog.updated,
      started: worklog.started,
      timeSpent: worklog.timeSpent,
      timeSpentSeconds: worklog.timeSpentSeconds,
    })) || [];
  }

  async addWorkLog(issueKey: string, timeSpentSeconds: number, comment?: string, started?: string): Promise<any> {
    const data: any = { timeSpentSeconds };
    if (started) data.started = started;
    if (comment) data.comment = this.toADF(comment);
    return this.client.post<any>(`/rest/api/3/issue/${issueKey}/worklog`, data);
  }

  async updateWorkLog(issueKey: string, worklogId: string, timeSpentSeconds?: number, comment?: string): Promise<any> {
    const data: any = {};
    if (timeSpentSeconds !== undefined) data.timeSpentSeconds = timeSpentSeconds;
    if (comment) data.comment = this.toADF(comment);
    return this.client.put<any>(`/rest/api/3/issue/${issueKey}/worklog/${worklogId}`, data);
  }

  async deleteWorkLog(issueKey: string, worklogId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/issue/${issueKey}/worklog/${worklogId}`);
  }
}
