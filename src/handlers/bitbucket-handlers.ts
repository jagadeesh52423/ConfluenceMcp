import { BitbucketService } from '../services/bitbucket.js';
import {
  ToolResponse,
  successResponse,
  jsonResponse,
  errorResponse,
  ERROR_TIPS,
} from '../error-handler.js';

/**
 * Bitbucket tool handlers
 */
export class BitbucketHandlers {
  constructor(private service: BitbucketService) {}

  async getRepositories(args: { query?: string; limit?: number }): Promise<ToolResponse> {
    const { query, limit } = args;
    try {
      const repos = await this.service.getRepositories({ query, limit });
      return jsonResponse(repos);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get Bitbucket repositories',
        params: { Query: query || 'none', Limit: limit || 10 },
        tip: ERROR_TIPS.BITBUCKET_REPO,
      });
    }
  }

  async getRepository(args: { repoName: string }): Promise<ToolResponse> {
    const { repoName } = args;
    try {
      const repo = await this.service.getRepository(repoName);
      return jsonResponse(repo);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get Bitbucket repository',
        params: { Repository: repoName },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async createRepository(args: {
    name: string;
    description?: string;
    isPrivate?: boolean;
    language?: string;
  }): Promise<ToolResponse> {
    const { name, description, isPrivate, language } = args;
    try {
      const repo = await this.service.createRepository(name, description, isPrivate, language);
      return jsonResponse(repo);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to create Bitbucket repository',
        params: {
          Name: name,
          Description: description || 'none',
          'Is Private': isPrivate ?? true,
          Language: language || 'none',
        },
        tip: ERROR_TIPS.BITBUCKET_REPO,
      });
    }
  }

  async getPullRequests(args: { repoName: string; state?: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, state, limit } = args;
    try {
      const prs = await this.service.getPullRequests(repoName, state, limit);
      return jsonResponse(prs);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get pull requests',
        params: { Repository: repoName, State: state || 'OPEN', Limit: limit || 10 },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async getPullRequest(args: { repoName: string; prId: number; includeDiff?: boolean }): Promise<ToolResponse> {
    const { repoName, prId, includeDiff = false } = args;
    try {
      const pr = await this.service.getPullRequest(repoName, prId, includeDiff);

      if (includeDiff && pr.diff) {
        return successResponse(
          `Pull Request #${prId} Details:\n\n${JSON.stringify(pr, null, 2)}\n\n---\n\nCode Diff:\n\n\`\`\`diff\n${pr.diff}\n\`\`\``
        );
      } else {
        return jsonResponse(pr);
      }
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get pull request',
        params: { Repository: repoName, 'PR ID': prId, 'Include Diff': includeDiff },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async createPullRequest(args: {
    repoName: string;
    title: string;
    sourceBranch: string;
    destinationBranch?: string;
    description?: string;
  }): Promise<ToolResponse> {
    const { repoName, title, sourceBranch, destinationBranch, description } = args;
    try {
      const pr = await this.service.createPullRequest(repoName, title, sourceBranch, destinationBranch, description);
      return jsonResponse(pr);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to create pull request',
        params: {
          Repository: repoName,
          Title: title,
          'Source Branch': sourceBranch,
          'Destination Branch': destinationBranch || 'main',
        },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async getBranches(args: { repoName: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, limit } = args;
    try {
      const branches = await this.service.getBranches(repoName, limit);
      return jsonResponse(branches);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get branches',
        params: { Repository: repoName, Limit: limit || 10 },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async getCommits(args: { repoName: string; branch?: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, branch, limit } = args;
    try {
      const commits = await this.service.getCommits(repoName, branch, limit);
      return jsonResponse(commits);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get commits',
        params: { Repository: repoName, Branch: branch || 'main', Limit: limit || 10 },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async getIssues(args: { repoName: string; state?: string; limit?: number }): Promise<ToolResponse> {
    const { repoName, state, limit } = args;
    try {
      const issues = await this.service.getIssues(repoName, state, limit);
      return jsonResponse(issues);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get issues',
        params: { Repository: repoName, State: state || 'open', Limit: limit || 10 },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async createIssue(args: {
    repoName: string;
    title: string;
    content?: string;
    kind?: string;
  }): Promise<ToolResponse> {
    const { repoName, title, content, kind } = args;
    try {
      const issue = await this.service.createIssue(repoName, title, content, kind);
      return jsonResponse(issue);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to create issue',
        params: { Repository: repoName, Title: title, Kind: kind || 'bug' },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async getPRComments(args: { repoName: string; prId: number }): Promise<ToolResponse> {
    const { repoName, prId } = args;
    try {
      const comments = await this.service.getPRComments(repoName, prId);
      return jsonResponse(comments);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to get PR comments',
        params: { Repository: repoName, 'PR ID': prId },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
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
    try {
      const inline = inlinePath ? { path: inlinePath, from: inlineFrom, to: inlineTo } : undefined;
      const comment = await this.service.addPRComment(repoName, prId, content, inline, parentId);
      return jsonResponse(comment);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to add PR comment',
        params: { Repository: repoName, 'PR ID': prId },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async updatePRComment(args: {
    repoName: string;
    prId: number;
    commentId: number;
    content: string;
  }): Promise<ToolResponse> {
    const { repoName, prId, commentId, content } = args;
    try {
      const comment = await this.service.updatePRComment(repoName, prId, commentId, content);
      return jsonResponse(comment);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to update PR comment',
        params: { Repository: repoName, 'PR ID': prId, 'Comment ID': commentId },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async deletePRComment(args: {
    repoName: string;
    prId: number;
    commentId: number;
  }): Promise<ToolResponse> {
    const { repoName, prId, commentId } = args;
    try {
      await this.service.deletePRComment(repoName, prId, commentId);
      return successResponse(`Comment ${commentId} deleted from PR #${prId} in ${repoName}.`);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to delete PR comment',
        params: { Repository: repoName, 'PR ID': prId, 'Comment ID': commentId },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async resolvePRComment(args: {
    repoName: string;
    prId: number;
    commentId: number;
  }): Promise<ToolResponse> {
    const { repoName, prId, commentId } = args;
    try {
      const comment = await this.service.resolvePRComment(repoName, prId, commentId);
      return jsonResponse(comment);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to resolve PR comment',
        params: { Repository: repoName, 'PR ID': prId, 'Comment ID': commentId },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }

  async unresolvePRComment(args: {
    repoName: string;
    prId: number;
    commentId: number;
  }): Promise<ToolResponse> {
    const { repoName, prId, commentId } = args;
    try {
      const comment = await this.service.unresolvePRComment(repoName, prId, commentId);
      return jsonResponse(comment);
    } catch (error: any) {
      return errorResponse(error, {
        operation: 'Failed to unresolve PR comment',
        params: { Repository: repoName, 'PR ID': prId, 'Comment ID': commentId },
        tip: ERROR_TIPS.BITBUCKET_REPO_VIEW,
      });
    }
  }
}
