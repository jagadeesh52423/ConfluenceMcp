import { JiraBaseService } from './base.js';

export class JiraAgileService extends JiraBaseService {

  async getAgileBoards(options?: { name?: string; type?: string; projectKeyOrId?: string }): Promise<any[]> {
    const params: any = { maxResults: 50 };
    if (options?.name) params.name = options.name;
    if (options?.type) params.type = options.type;
    if (options?.projectKeyOrId) params.projectKeyOrId = options.projectKeyOrId;
    const response = await this.client.get<any>('/rest/agile/1.0/board', params);
    return response.values?.map((board: any) => ({
      id: board.id,
      name: board.name,
      type: board.type,
      location: board.location ? {
        projectId: board.location.projectId,
        projectKey: board.location.projectKey,
        projectName: board.location.projectName,
      } : null,
    })) || [];
  }

  async getBoardIssues(boardId: number, options?: { jql?: string; maxResults?: number; startAt?: number }): Promise<any> {
    const params: any = { maxResults: options?.maxResults || 50 };
    if (options?.jql) params.jql = options.jql;
    if (options?.startAt) params.startAt = options.startAt;
    const response = await this.client.get<any>(`/rest/agile/1.0/board/${boardId}/issue`, params);
    return {
      total: response.total,
      issues: response.issues?.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields?.summary || '',
        status: issue.fields?.status?.name || '',
        assignee: issue.fields?.assignee?.displayName || '',
        priority: issue.fields?.priority?.name || '',
      })) || [],
    };
  }

  async getSprints(boardId: number, state?: string): Promise<any[]> {
    const params: any = { maxResults: 50 };
    if (state) params.state = state;
    const response = await this.client.get<any>(`/rest/agile/1.0/board/${boardId}/sprint`, params);
    return response.values?.map((sprint: any) => ({
      id: sprint.id,
      name: sprint.name,
      state: sprint.state,
      startDate: sprint.startDate || null,
      endDate: sprint.endDate || null,
      completeDate: sprint.completeDate || null,
      goal: sprint.goal || '',
    })) || [];
  }

  async getSprintIssues(sprintId: number, options?: { jql?: string; maxResults?: number; startAt?: number }): Promise<any> {
    const params: any = { maxResults: options?.maxResults || 50 };
    if (options?.jql) params.jql = options.jql;
    if (options?.startAt) params.startAt = options.startAt;
    const response = await this.client.get<any>(`/rest/agile/1.0/sprint/${sprintId}/issue`, params);
    return {
      total: response.total,
      issues: response.issues?.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields?.summary || '',
        status: issue.fields?.status?.name || '',
        assignee: issue.fields?.assignee?.displayName || '',
        priority: issue.fields?.priority?.name || '',
      })) || [],
    };
  }

  async moveIssuesToSprint(sprintId: number, issueKeys: string[]): Promise<void> {
    await this.client.post(`/rest/agile/1.0/sprint/${sprintId}/issue`, { issues: issueKeys });
  }

  async createSprint(boardId: number, name: string, options?: { startDate?: string; endDate?: string; goal?: string }): Promise<any> {
    const data: any = { name, originBoardId: boardId };
    if (options?.startDate) data.startDate = options.startDate;
    if (options?.endDate) data.endDate = options.endDate;
    if (options?.goal) data.goal = options.goal;
    const response = await this.client.post<any>('/rest/agile/1.0/sprint', data);
    return {
      id: response.id,
      name: response.name,
      state: response.state,
      startDate: response.startDate || null,
      endDate: response.endDate || null,
      goal: response.goal || '',
    };
  }

  async updateSprint(sprintId: number, updates: { name?: string; state?: string; startDate?: string; endDate?: string; goal?: string }): Promise<any> {
    const data: any = {};
    if (updates.name) data.name = updates.name;
    if (updates.state) data.state = updates.state;
    if (updates.startDate) data.startDate = updates.startDate;
    if (updates.endDate) data.endDate = updates.endDate;
    if (updates.goal !== undefined) data.goal = updates.goal;
    const response = await this.client.post<any>(`/rest/agile/1.0/sprint/${sprintId}`, data);
    return {
      id: response.id,
      name: response.name,
      state: response.state,
      startDate: response.startDate || null,
      endDate: response.endDate || null,
      goal: response.goal || '',
    };
  }
}
