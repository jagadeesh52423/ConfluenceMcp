export interface AtlassianConfig {
  domain: string;
  email: string;
  apiToken: string;
  clientId?: string;
  clientSecret?: string;
}

export interface BitbucketConfig {
  workspace: string;
  username: string;
  apiToken: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  assignee?: string;
  created: string;
  updated: string;
}

export interface ConfluencePage {
  id: string;
  title: string;
  content: string;
  spaceKey: string;
  version: number;
  created: string;
  updated: string;
}

export interface BitbucketRepository {
  name: string;
  fullName: string;
  description: string;
  language: string;
  private: boolean;
  createdOn: string;
  updatedOn: string;
}

export interface SearchOptions {
  query?: string;
  limit?: number;
  startAt?: number;
  expand?: string[];
}