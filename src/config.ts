import dotenv from 'dotenv';
import { AtlassianConfig, BitbucketConfig } from './types.js';

dotenv.config();

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
  appPassword: process.env.BITBUCKET_APP_PASSWORD || '',
};

export function validateConfig(): void {
  const required = ['ATLASSIAN_DOMAIN', 'ATLASSIAN_EMAIL', 'ATLASSIAN_API_TOKEN'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function getBitbucketAuth(): string {
  if (bitbucketConfig.username && bitbucketConfig.appPassword) {
    return Buffer.from(`${bitbucketConfig.username}:${bitbucketConfig.appPassword}`).toString('base64');
  }
  return Buffer.from(`${atlassianConfig.email}:${atlassianConfig.apiToken}`).toString('base64');
}

export function getAtlassianAuth(): string {
  return Buffer.from(`${atlassianConfig.email}:${atlassianConfig.apiToken}`).toString('base64');
}