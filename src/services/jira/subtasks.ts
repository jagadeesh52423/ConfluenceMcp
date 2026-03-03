import { JiraBaseService } from './base.js';
import type { JiraIssueService } from './issues.js';

export class JiraSubtaskService extends JiraBaseService {
  constructor(
    client: ConstructorParameters<typeof JiraBaseService>[0],
    private readonly issueService: JiraIssueService
  ) {
    super(client);
  }

  async getSubTasks(issueKey: string): Promise<any[]> {
    const issue = await this.client.get<any>(`/rest/api/3/issue/${issueKey}`, { fields: ['subtasks'] });
    return issue.fields.subtasks?.map((subtask: any) => ({
      id: subtask.id,
      key: subtask.key,
      summary: subtask.fields?.summary,
      status: subtask.fields?.status?.name,
      assignee: subtask.fields?.assignee?.displayName,
    })) || [];
  }

  async createSubTask(parentKey: string, summary: string, description: string): Promise<any> {
    const data = {
      fields: {
        project: { key: parentKey.split('-')[0] },
        parent: { key: parentKey },
        summary,
        description: this.toADF(description),
        issuetype: { name: 'Sub-task' },
      },
    };
    const response = await this.client.post<any>('/rest/api/3/issue', data);
    return this.issueService.getIssue(response.key);
  }
}
