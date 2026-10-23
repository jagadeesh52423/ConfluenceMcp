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

  async getPRDiffstat(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    return this.handle(
      () => this.service.getPRDiffstat(repoName, prId),
      { operation: 'Failed to get PR diffstat', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getPRFileDiff(args: { repoName: string; prId: number; path: string }): Promise<ToolResponse> {
    const { repoName, prId, path } = args;
    return this.handle(
      () => this.service.getPRFileDiff(repoName, prId, path),
      { operation: 'Failed to get PR file diff', params: { Repository: repoName, 'PR ID': prId, Path: path }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getFileContent(args: { repoName: string; path: string; ref?: string }): Promise<ToolResponse> {
    const { repoName, path, ref } = args;
    return this.handle(
      () => this.service.getFileContent(repoName, path, ref),
      { operation: 'Failed to get file content', params: { Repository: repoName, Path: path, Ref: ref || 'default branch' }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getPRStatuses(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    return this.handle(
      () => this.service.getPRStatuses(repoName, prId),
      { operation: 'Failed to get PR statuses', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getPipelines(args: { repoName: string; branch?: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, branch, limit } = args;
    return this.handle(
      () => this.service.getPipelines(repoName, branch, limit),
      { operation: 'Failed to get pipelines', params: { Repository: repoName, Branch: branch || 'any', Limit: limit || 10 }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getPipelineSteps(args: { repoName: string; pipelineUuid: string }): Promise<ToolResponse> {
    const { repoName, pipelineUuid } = args;
    return this.handle(
      () => this.service.getPipelineSteps(repoName, pipelineUuid),
      { operation: 'Failed to get pipeline steps', params: { Repository: repoName, Pipeline: pipelineUuid }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async getPipelineStepLog(args: { repoName: string; pipelineUuid: string; stepUuid: string }): Promise<ToolResponse> {
    const { repoName, pipelineUuid, stepUuid } = args;
    return this.handle(
      () => this.service.getPipelineStepLog(repoName, pipelineUuid, stepUuid),
      { operation: 'Failed to get pipeline step log', params: { Repository: repoName, Pipeline: pipelineUuid, Step: stepUuid }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async createPullRequest(args: {
    repoName: string;
    title: string;
    sourceBranch: string;
    destinationBranch?: string;
    description?: string;
    draft?: boolean;
    reviewers?: string[];
    closeSourceBranch?: boolean;
  }): Promise<ToolResponse> {
    const { repoName, title, sourceBranch, destinationBranch, description, draft, reviewers, closeSourceBranch } = args;
    return this.handle(
      () => this.service.createPullRequest(repoName, title, sourceBranch, destinationBranch, description, draft, reviewers, closeSourceBranch),
      {
        operation: 'Failed to create pull request',
        params: { Repository: repoName, Title: title, 'Source Branch': sourceBranch, 'Destination Branch': destinationBranch || 'main' },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      },
      jsonResponse
    );
  }

  async updatePullRequest(args: {
    repoName: string;
    prId: number;
    title?: string;
    description?: string;
    destinationBranch?: string;
    draft?: boolean;
    reviewers?: string[];
  }): Promise<ToolResponse> {
    const { repoName, prId, title, description, destinationBranch, draft, reviewers } = args;
    const updateParams: Record<string, any> = {};
    if (title !== undefined) updateParams.Title = title;
    if (description !== undefined) updateParams.Description = description;
    if (destinationBranch !== undefined) updateParams['Destination Branch'] = destinationBranch;
    if (draft !== undefined) updateParams.Draft = draft;
    if (reviewers !== undefined) updateParams.Reviewers = reviewers.join(', ');
    return this.handle(
      () => {
        if (title === undefined && description === undefined && destinationBranch === undefined && draft === undefined && reviewers === undefined) {
          throw new Error('At least one of title, description, destinationBranch, draft, or reviewers must be provided');
        }
        return this.service.updatePullRequest(repoName, prId, { title, description, destinationBranch, draft, reviewers });
      },
      {
        operation: 'Failed to update pull request',
        params: { Repository: repoName, 'PR ID': prId, ...updateParams },
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

  async approvePR(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    return this.handle(
      () => this.service.approvePR(repoName, prId),
      { operation: 'Failed to approve PR', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async unapprovePR(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    return this.handle(
      () => this.service.unapprovePR(repoName, prId),
      { operation: 'Failed to remove approval from PR', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async requestChangesPR(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    return this.handle(
      () => this.service.requestChangesPR(repoName, prId),
      { operation: 'Failed to request changes on PR', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async removeChangeRequestPR(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    return this.handle(
      () => this.service.removeChangeRequestPR(repoName, prId),
      { operation: 'Failed to remove change request from PR', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async mergePR(args: {
    repoName: string;
    prId: number;
    mergeStrategy?: string;
    message?: string;
    closeSourceBranch?: boolean;
  }): Promise<ToolResponse> {
    const { repoName, prId, mergeStrategy, message, closeSourceBranch } = args;
    return this.handle(
      () => this.service.mergePR(repoName, prId, { mergeStrategy, message, closeSourceBranch }),
      { operation: 'Failed to merge PR', params: { Repository: repoName, 'PR ID': prId, 'Merge Strategy': mergeStrategy }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }

  async declinePR(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    return this.handle(
      () => this.service.declinePR(repoName, prId),
      { operation: 'Failed to decline PR', params: { Repository: repoName, 'PR ID': prId }, tip: ERROR_TIPS.BITBUCKET_REPO_VIEW },
      jsonResponse
    );
  }
}
