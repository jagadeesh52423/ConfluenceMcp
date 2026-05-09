import { JiraClient } from '../../clients/jira-client.js';
import {
  extractTextFromADF,
  markdownToADF,
} from '../../formatters/index.js';

export abstract class JiraBaseService {
  constructor(protected readonly client: JiraClient) {}

  protected extractText(body: any): string { return extractTextFromADF(body); }
  protected toADF(text: string): any        { return markdownToADF(text); }
}
