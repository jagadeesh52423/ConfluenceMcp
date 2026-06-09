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
  /**
   * Page body. With Confluence v2 / ADF, this is the parsed ADF JSON document
   * (an object with type "doc" plus content/version). The legacy v1 search
   * endpoint (kept for CQL) still returns storage-format HTML as a string —
   * which is why the field type is `any` rather than a strict ADF interface.
   */
  content: any;
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

/**
 * Kinds of Confluence comment this server can read.
 * Add a new value here and register a fetcher in ConfluenceService to support
 * another comment kind — callers and the tool layer need no other changes.
 */
export type ConfluenceCommentType = 'footer' | 'inline';

/** Selector accepted by getComments — a single kind or every kind. */
export type ConfluenceCommentFilter = ConfluenceCommentType | 'all';

export interface ConfluenceComment {
  id: string;
  /**
   * Discriminates footer (page-level) from inline (text-anchored) comments.
   * Always populated so callers can tell the two apart in a mixed `all` result.
   */
  type: ConfluenceCommentType;
  /**
   * Comment body. With v2/ADF this is the parsed ADF JSON document.
   * Type widened from string for the same reasons as ConfluencePage.content.
   */
  body: any;
  author: string;
  authorAccountId?: string;
  created: string;
  updated?: string;
  version: number;
  // ----- inline-comment-only fields (undefined for footer comments) -----
  /**
   * Resolution status reported by Confluence for inline comments, e.g.
   * 'open', 'resolved', 'reopened', 'dangling'. Undefined for footer comments.
   */
  resolutionStatus?: string;
  /**
   * The highlighted page text the inline comment is anchored to (the original
   * selection the author commented on). Undefined for footer comments.
   */
  anchoredText?: string;
  /** Marker reference linking the comment to its anchor in the page body. */
  markerRef?: string;
  /** Relative web UI link to view the comment in context, when provided. */
  webuiLink?: string;
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
  /** Whether the comment has been resolved. */
  resolved?: boolean;
  /** ISO timestamp of when the comment was resolved, when available. */
  resolvedOn?: string;
  /** Display name of the user who resolved the comment, when available. */
  resolvedBy?: string;
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

export interface SnapshotConfig {
  enabled: boolean;
  dir: string;
  retentionDays: number;
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