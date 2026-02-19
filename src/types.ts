export interface ConfluenceConfig {
  domain: string;
  email: string;
  apiToken: string;
}

export interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
  clientId?: string;
  clientSecret?: string;
}

// Legacy interface for backward compatibility
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
  labels?: string[];
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

export interface ConfluenceAttachment {
  id: string;
  title: string;
  filename: string;
  mediaType: string;
  fileSize: number;
  created: string;
  downloadUrl: string;
}

export interface ConfluenceImage {
  filename?: string;
  fileContent?: string;
  filePath?: string;
  alt?: string;
  caption?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ConfluenceComment {
  id: string;
  body: string;
  author: string;
  authorAccountId?: string;
  created: string;
  updated?: string;
  version: number;
}

export interface BitbucketPRComment {
  id: number;
  content: string;
  author: string;
  authorAccountId?: string;
  created: string;
  updated: string;
  inline?: {
    path: string;
    from?: number;
    to?: number;
  };
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
  assignee?: string;
  status?: string;
  project?: string;
  labels?: string[];
  reporter?: string;
  createdAfter?: string;
  updatedAfter?: string;
  jql?: string;
  fields?: string[];
  limit?: number;
  startAt?: number;
  expand?: string[];
}

// Smart Field Handling Types
export interface JiraFieldOption {
  id: string;
  value: string;
}

export interface JiraFieldSuggestion {
  value: string;
  id?: string;
  reason: string;
}

export interface JiraRequiredField {
  key: string;
  name: string;
  type: string;
  required: boolean;
  options?: JiraFieldOption[];
  suggestion?: JiraFieldSuggestion;
}

export interface JiraTransitionResponse {
  success: boolean;
  requiresInput?: boolean;
  requiredFields?: JiraRequiredField[];
  message?: string;
  issueKey?: string;
  transitionId?: string;
}

export interface FieldSuggestionRule {
  pattern: RegExp;
  defaultValue: string;
  contextRules?: {
    condition: (issue: JiraIssue) => boolean;
    value: string;
    reason: string;
  }[];
}