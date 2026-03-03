import { JiraBaseService } from './base.js';

export class JiraCommentService extends JiraBaseService {

  async addComment(issueKey: string, comment: string): Promise<void> {
    await this.client.post(`/rest/api/3/issue/${issueKey}/comment`, { body: this.toADF(comment) });
  }

  async getComments(issueKey: string): Promise<any[]> {
    const response = await this.client.get<any>(`/rest/api/3/issue/${issueKey}/comment`);
    return response.comments.map((comment: any) => ({
      id: comment.id,
      author: comment.author?.displayName || 'Unknown',
      authorAccountId: comment.author?.accountId,
      body: this.extractText(comment.body),
      created: comment.created,
      updated: comment.updated,
      updateAuthor: comment.updateAuthor?.displayName,
    }));
  }

  async updateComment(issueKey: string, commentId: string, comment: string): Promise<any> {
    const response = await this.client.put<any>(
      `/rest/api/3/issue/${issueKey}/comment/${commentId}`,
      { body: this.toADF(comment) }
    );
    return {
      id: response.id,
      author: response.author?.displayName || 'Unknown',
      body: this.extractText(response.body),
      created: response.created,
      updated: response.updated,
      updateAuthor: response.updateAuthor?.displayName,
    };
  }

  async deleteComment(issueKey: string, commentId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/issue/${issueKey}/comment/${commentId}`);
  }
}
