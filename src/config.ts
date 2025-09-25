import dotenv from 'dotenv';
import { ConfluenceConfig, JiraConfig, AtlassianConfig, BitbucketConfig } from './types.js';

dotenv.config();

export const confluenceConfig: ConfluenceConfig = {
  domain: process.env.CONFLUENCE_DOMAIN || process.env.ATLASSIAN_DOMAIN || '',
  email: process.env.CONFLUENCE_EMAIL || process.env.ATLASSIAN_EMAIL || '',
  apiToken: process.env.CONFLUENCE_API_TOKEN || process.env.ATLASSIAN_API_TOKEN || '',
};

export const jiraConfig: JiraConfig = {
  domain: process.env.JIRA_DOMAIN || process.env.ATLASSIAN_DOMAIN || '',
  email: process.env.JIRA_EMAIL || process.env.ATLASSIAN_EMAIL || '',
  apiToken: process.env.JIRA_API_TOKEN || process.env.ATLASSIAN_API_TOKEN || '',
  clientId: process.env.JIRA_CLIENT_ID || process.env.ATLASSIAN_CLIENT_ID,
  clientSecret: process.env.JIRA_CLIENT_SECRET || process.env.ATLASSIAN_CLIENT_SECRET,
};

// Legacy config for backward compatibility
export const atlassianConfig: AtlassianConfig = {
  domain: process.env.ATLASSIAN_DOMAIN || '',
  email: process.env.ATLASSIAN_EMAIL || '',
  apiToken: process.env.ATLASSIAN_API_TOKEN || '',
  clientId: process.env.ATLASSIAN_CLIENT_ID,
  clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
};

export const bitbucketConfig: BitbucketConfig = {
  workspace: process.env.BITBUCKET_WORKSPACE || '',
  username: process.env.BITBUCKET_USERNAME || '',
  apiToken: process.env.BITBUCKET_API_TOKEN || '',
};

export function validateConfig(): void {
  const errors: string[] = [];

  // Check if we have at least one service configured
  const hasConfluence = process.env.CONFLUENCE_DOMAIN && process.env.CONFLUENCE_EMAIL && process.env.CONFLUENCE_API_TOKEN;
  const hasJira = process.env.JIRA_DOMAIN && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN;
  const hasLegacy = process.env.ATLASSIAN_DOMAIN && process.env.ATLASSIAN_EMAIL && process.env.ATLASSIAN_API_TOKEN;

  if (!hasConfluence && !hasLegacy) {
    errors.push('Confluence configuration missing. Set CONFLUENCE_DOMAIN, CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN or fallback ATLASSIAN_* variables');
  }

  if (!hasJira && !hasLegacy) {
    errors.push('Jira configuration missing. Set JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN or fallback ATLASSIAN_* variables');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export function getConfluenceAuth(): string {
  return Buffer.from(`${confluenceConfig.email}:${confluenceConfig.apiToken}`).toString('base64');
}

export function getJiraAuth(): string {
  return Buffer.from(`${jiraConfig.email}:${jiraConfig.apiToken}`).toString('base64');
}

export function getBitbucketAuth(): string {
  if (bitbucketConfig.username && bitbucketConfig.apiToken) {
    return Buffer.from(`${bitbucketConfig.username}:${bitbucketConfig.apiToken}`).toString('base64');
  }
  return Buffer.from(`${atlassianConfig.email}:${atlassianConfig.apiToken}`).toString('base64');
}

// Legacy function for backward compatibility
export function getAtlassianAuth(): string {
  return Buffer.from(`${atlassianConfig.email}:${atlassianConfig.apiToken}`).toString('base64');
}