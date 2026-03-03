import { JiraBaseService } from './base.js';

export class JiraVersionService extends JiraBaseService {

  async getProjectVersions(projectKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/project/${projectKey}/versions`);
    return response.map((v: any) => ({
      id: v.id,
      name: v.name,
      description: v.description || '',
      released: v.released || false,
      archived: v.archived || false,
      startDate: v.startDate || null,
      releaseDate: v.releaseDate || null,
    }));
  }

  async createVersion(projectKey: string, name: string, options?: { description?: string; startDate?: string; releaseDate?: string; released?: boolean }): Promise<any> {
    const data: any = { project: projectKey, name };
    if (options?.description) data.description = options.description;
    if (options?.startDate) data.startDate = options.startDate;
    if (options?.releaseDate) data.releaseDate = options.releaseDate;
    if (options?.released !== undefined) data.released = options.released;
    const response = await this.client.post<any>('/rest/api/3/version', data);
    return {
      id: response.id,
      name: response.name,
      description: response.description || '',
      released: response.released || false,
      archived: response.archived || false,
      startDate: response.startDate || null,
      releaseDate: response.releaseDate || null,
    };
  }

  async updateVersion(versionId: string, updates: { name?: string; description?: string; startDate?: string; releaseDate?: string; released?: boolean; archived?: boolean }): Promise<any> {
    const data: any = {};
    if (updates.name) data.name = updates.name;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.startDate) data.startDate = updates.startDate;
    if (updates.releaseDate) data.releaseDate = updates.releaseDate;
    if (updates.released !== undefined) data.released = updates.released;
    if (updates.archived !== undefined) data.archived = updates.archived;
    const response = await this.client.put<any>(`/rest/api/3/version/${versionId}`, data);
    return {
      id: response.id,
      name: response.name,
      description: response.description || '',
      released: response.released || false,
      archived: response.archived || false,
      startDate: response.startDate || null,
      releaseDate: response.releaseDate || null,
    };
  }
}
