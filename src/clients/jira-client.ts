import { BaseApiClient } from './base-client.js';
import { jiraConfig, getJiraAuth } from '../config.js';
import { SERVICE_NAMES } from '../constants.js';

/**
 * Jira API client extending the base client
 */
export class JiraClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: `https://${jiraConfig.domain}`,
      auth: getJiraAuth(),
      serviceName: SERVICE_NAMES.JIRA,
    });
  }
}
