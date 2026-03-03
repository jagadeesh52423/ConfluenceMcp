import { JiraBaseService } from './base.js';

export class JiraAttachmentService extends JiraBaseService {

  async getAttachments(issueKey: string): Promise<any[]> {
    const issue = await this.client.get<any>(`/rest/api/3/issue/${issueKey}`, { fields: ['attachment'] });
    return issue.fields.attachment?.map((att: any) => ({
      id: att.id,
      filename: att.filename,
      author: att.author?.displayName || 'Unknown',
      created: att.created,
      size: att.size,
      mimeType: att.mimeType,
      content: att.content,
    })) || [];
  }

  async addAttachment(issueKey: string, filename: string, fileContent: string): Promise<any> {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    const buffer = Buffer.from(fileContent, 'base64');
    form.append('file', buffer, { filename });
    return this.client.postFormData(`/rest/api/3/issue/${issueKey}/attachments`, form);
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.client.delete(`/rest/api/3/attachment/${attachmentId}`);
  }
}
