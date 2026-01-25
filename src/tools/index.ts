export { ToolDefinition, confluenceTools } from './confluence-tools.js';
export { jiraTools } from './jira-tools.js';
export { bitbucketTools } from './bitbucket-tools.js';

import { confluenceTools } from './confluence-tools.js';
import { jiraTools } from './jira-tools.js';
import { bitbucketTools } from './bitbucket-tools.js';

/**
 * All available MCP tools combined
 */
export const allTools = [
  ...confluenceTools,
  ...jiraTools,
  ...bitbucketTools,
];
