import { BitbucketService } from '../services/bitbucket.js';
import {
  ToolResponse,
  successResponse,
  jsonResponse,
  errorResponse,
  ERROR_TIPS,
} from '../error-handler.js';
import { BaseHandler } from './base-handler.js';

/**
 * Bitbucket tool handlers
 */
export class BitbucketHandlers extends BaseHandler {
  constructor(private service: BitbucketService) { super(); }

  async getRepositories(args: { query?: string; limit?: number }): Promise<ToolResponse> {
    const { query, limit } = args;
    return this.handle(
      () => this.service.getRepositories({ query, limit }),
      { operation: 'Failed to get Bitbucket repositories', params: { Query: query || 'none', Limit: limit || 10 }, tip: ERROR_TIPS.BITBUCKET_REPO },
      jsonResponse
    );
  }

  async getRepository(args: { repoName: string }): Promise<ToolResponse> {
    const { repoName } = args;
    return this.handle(
      () => this.service.getRepository(repoName),
      { operation: 'Failed to get Bitbucket repository', params: { Repository: repoName }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async createRepository(args: {
    name: string;
    description?: string;
    isPrivate?: boolean;
    language?: string;
  }): Promise<ToolResponse> {
    const { name, description, isPrivate, language } = args;
    return this.handle(
      () => this.service.createRepository(name, description, isPrivate, language),
      {
        operation: 'Failed to create Bitbucket repository',
        params: { Name: name, Description: description || 'none', 'Is Private': isPrivate ?? true, Language: language || 'none' },
        tip: ERROR_TIPS.BITBUCKET_REPO,
      },
      jsonResponse
    );
  }

  async getPullRequests(args: { repoName: string; state?: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, state, limit } = args;
    return this.handle(
      () => this.service.getPullRequests(repoName, state, limit),
      { operation: 'Failed to get pull requests', params: { Repository: repoName, State: state || 'OPEN', Limit: limit || 10 }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getPullRequest(args: { repoName: string; prId: number; includeDiff?: boolean }): Promise<ToolResponse> {
    const { repoName, prId, includeDiff = false } = args;
    return this.handle(
      () => this.service.getPullRequest(repoName, prId, includeDiff),
      { operation: 'Failed to get pull request', params: { Repository: repoName, 'PR ID': prId, 'Include Diff': includeDiff }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      (pr) => {
        if (includeDiff && pr.diff) {
          return successResponse(
            `Pull Request #${prId} Details:\n\n${JSON.stringify(pr, null, 2)}\n\n---\n\nCode Diff:\n\n\`\`\`diff\n${pr.diff}\n\`\`\``
          );
        }
        return jsonResponse(pr);
      }
    );
  }

  async createPullRequest(args: {
    repoName: string;
    title: string;
    sourceBranch: string;
    destinationBranch?: string;
    description?: string;
  }): Promise<ToolResponse> {
    const { repoName, title, sourceBranch, destinationBranch, description } = args;
    return this.handle(
      () => this.service.createPullRequest(repoName, title, sourceBranch, destinationBranch, description),
      {
        operation: 'Failed to create pull request',
        params: { Repository: repoName, Title: title, 'Source Branch': sourceBranch, 'Destination Branch': destinationBranch || 'main' },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      },
      jsonResponse
    );
  }

  async getBranches(args: { repoName: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, limit } = args;
    return this.handle(
      () => this.service.getBranches(repoName, limit),
      { operation: 'Failed to get branches', params: { Repository: repoName, Limit: limit || 10 }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getCommits(args: { repoName: string; branch?: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, branch, limit } = args;
    return this.handle(
      () => this.service.getCommits(repoName, branch, limit),
      { operation: 'Failed to get commits', params: { Repository: repoName, Branch: branch || 'main', Limit: limit || 10 }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getIssues(args: { repoName: string; state?: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, state, limit } = args;
    return this.handle(
      () => this.service.getIssues(repoName, state, limit),
      { operation: 'Failed to get issues', params: { Repository: repoName, State: state || 'open', Limit: limit || 10 }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async createIssue(args: {
    repoName: string;
    title: string;
    content?: string;
    kind?: string;
  }): Promise<ToolResponse> {
    const { repoName, title, content, kind } = args;
    return this.handle(
      () => this.service.createIssue(repoName, title, content, kind),
      { operation: 'Failed to create issue', params: { Repository: repoName, Title: title, Kind: kind || 'bug' }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getPRComments(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    return this.handle(
      () => this.service.getPRComments(repoName, prId),
      { operation: 'Failed to get PR comments', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async addPRComment(args: {
    repoName: string;
    prId: number;
    content: string;
    inlinePath?: string;
    inlineFrom?: number;
    inlineTo?: number;
    parentId?: number;
  }): Promise<ToolResponse> {
    const { repoName, prId, content, inlinePath, inlineFrom, inlineTo, parentId } = args;
    const inline = inlinePath ? { path: inlinePath, from: inlineFrom, to: inlineTo } : undefined;
    return this.handle(
      () => this.service.addPRComment(repoName, prId, content, inline, parentId),
      { operation: 'Failed to add PR comment', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async updatePRComment(args: {
    repoName: string;
    prId: number;
    commentId: number;
    content: string;
  }): Promise<ToolResponse> {
    const { repoName, prId, commentId, content } = args;
    return this.handle(
      () => this.service.updatePRComment(repoName, prId, commentId, content),
      { operation: 'Failed to update PR comment', params: { Repository: repoName, 'PR ID': prId, 'Comment ID': commentId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async deletePRComment(args: {
    repoName: string;
    prId: number;
    commentId: number;
  }): Promise<ToolResponse> {
    const { repoName, prId, commentId } = args;
    return this.handle(
      () => this.service.deletePRComment(repoName, prId, commentId),
      { operation: 'Failed to delete PR comment', params: { Repository: repoName, 'PR ID': prId, 'Comment ID': commentId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      () => successResponse(`Comment ${commentId} deleted from PR #${prId} in ${repoName}.`)
    );
  }

  async resolvePRComment(args: {
    repoName: string;
    prId: number;
    commentId: number;
  }): Promise<ToolResponse> {
    const { repoName, prId, commentId } = args;
    return this.handle(
      () => this.service.resolvePRComment(repoName, prId, commentId),
      { operation: 'Failed to resolve PR comment', params: { Repository: repoName, 'PR ID': prId, 'Comment ID': commentId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async unresolvePRComment(args: {
    repoName: string;
    prId: number;
    commentId: number;
  }): Promise<ToolResponse> {
    const { repoName, prId, commentId } = args;
    return this.handle(
      () => this.service.unresolvePRComment(repoName, prId, commentId),
      { operation: 'Failed to unresolve PR comment', params: { Repository: repoName, 'PR ID': prId, 'Comment ID': commentId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }
}
