import { JiraBaseService } from './base.js';

export class JiraWatcherService extends JiraBaseService {

  async getWatchers(issueKey: string): Promise<any> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/watchers`);
    return {
      watchCount: response.watchCount,
      isWatching: response.isWatching,
      watchers: response.watchers?.map((watcher: any) => ({
        accountId: watcher.accountId,
        displayName: watcher.displayName,
        emailAddress: watcher.emailAddress,
        active: watcher.active,
      })) || [],
    };
  }

  async addWatcher(issueKey: string, accountId: string): Promise<void> {
    await this.client.post(`/rest/api/3/issue/${issueKey}/watchers`, JSON.stringify(accountId));
  }

  async removeWatcher(issueKey: string, accountId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/issue/${issueKey}/watchers?accountId=${accountId}`);
  }
}
