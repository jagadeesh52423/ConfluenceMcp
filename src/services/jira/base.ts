import { JiraClient } from '../../clients/jira-client.js';
import {
  extractTextFromADF,
  parseDescriptionToADF,
  parseDescriptionToWikiMarkup,
} from '../../formatters/index.js';

export abstract class JiraBaseService {
  constructor(protected readonly client: JiraClient) {}

  protected extractText(body: any): string { return extractTextFromADF(body); }
  protected toADF(text: string): any        { return parseDescriptionToADF(text); }
  protected toWiki(text: string): string    { return parseDescriptionToWikiMarkup(text); }
}
