import axios, { AxiosInstance } from 'axios';
import { bitbucketConfig, getBitbucketAuth } from '../config.js';
import { BitbucketRepository, BitbucketPRComment, SearchOptions } from '../types.js';
import { assertMarkdown } from '../formatters/index.js';

export class BitbucketService {
  private client: AxiosInstance;
  private workspace: string;

  constructor() {
    this.workspace = bitbucketConfig.workspace;
    this.client = axios.create({
      baseURL: 'https://api.bitbucket.org/2.0',
      headers: {
        'Authorization': `Basic ${getBitbucketAuth()}`,
        'Accept': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Bitbucket API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  async getRepositories(options: SearchOptions = {}): Promise<BitbucketRepository[]> {
    const { limit = 10, query } = options;
    let url = `/repositories/${this.workspace}`;

    const params: any = {
      pagelen: limit,
      sort: '-updated_on'
    };

    if (query) {
      params.q = `name~"${query}"`;
    }

    const response = await this.client.get(url, { params });

    return response.data.values.map(BitbucketService.mapRepository);
  }

  async getRepository(repoName: string): Promise<BitbucketRepository> {
    const response = await this.client.get(`/repositories/${this.workspace}/${repoName}`);
    return BitbucketService.mapRepository(response.data);
  }

  async createRepository(
    name: string,
    description: string = '',
    isPrivate: boolean = true,
    language: string = ''
  ): Promise<BitbucketRepository> {
    const data: any = {
      name,
      description,
      is_private: isPrivate,
      scm: 'git'
    };

    if (language) {
      data.language = language;
    }

    const response = await this.client.post(`/repositories/${this.workspace}/${name}`, data);
    return BitbucketService.mapRepository(response.data);
  }

  private static mapRepository(repo: any): BitbucketRepository {
    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      private: repo.is_private,
      createdOn: repo.created_on,
      updatedOn: repo.updated_on,
    };
  }

  private static mapComment(c: any): BitbucketPRComment {
    return {
      id: c.id,
      content: c.content?.raw || '',
      author: c.user?.display_name || 'Unknown',
      authorAccountId: c.user?.account_id,
      created: c.created_on,
      updated: c.updated_on,
      inline: c.inline ? { path: c.inline.path, from: c.inline.from, to: c.inline.to } : undefined,
      resolved: !!c.resolution,
      resolvedOn: c.resolution?.created_on,
      resolvedBy: c.resolution?.user?.display_name,
    };
  }

  async deleteRepository(repoName: string): Promise<void> {
    await this.client.delete(`/repositories/${this.workspace}/${repoName}`);
  }

  async getBranches(repoName: string, limit: number = 10): Promise<any[]> {
    const params = { pagelen: limit };
    const response = await this.client.get(`/repositories/${this.workspace}/${repoName}/refs/branches`, { params });
    return response.data.values;
  }

  async createBranch(repoName: string, branchName: string, targetBranch: string = 'main'): Promise<any> {
    const data = {
      name: branchName,
      target: {
        hash: targetBranch
      }
    };

    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/refs/branches`, data);
    return response.data;
  }

  async getPullRequests(repoName: string, state: string = 'OPEN', limit: number = 10): Promise<any[]> {
    const params = {
      state: state.toUpperCase(),
      pagelen: limit,
      sort: '-updated_on'
    };

    const response = await this.client.get(`/repositories/${this.workspace}/${repoName}/pullrequests`, { params });
    return response.data.values;
  }

  async getPullRequest(repoName: string, prId: number, includeDiff: boolean = false): Promise<any> {
    const response = await this.client.get(`/repositories/${this.workspace}/${repoName}/pullrequests/${prId}`);
    const pullRequest = response.data;

    if (includeDiff) {
      try {
        const diffResponse = await this.client.get(
          `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/diff`,
          { responseType: 'text' }
        );
        pullRequest.diff = diffResponse.data;
      } catch (error) {
        console.warn(`Failed to fetch diff for PR ${prId}:`, error);
        pullRequest.diff = null;
      }
    }

    return pullRequest;
  }


  async createPullRequest(
    repoName: string,
    title: string,
    sourceBranch: string,
    destinationBranch: string = 'main',
    description: string = '',
    draft?: boolean,
    reviewers?: string[],
    closeSourceBranch?: boolean
  ): Promise<any> {
    assertMarkdown(description, 'description');
    const data: any = {
      title,
      description,
      source: {
        branch: { name: sourceBranch }
      },
      destination: {
        branch: { name: destinationBranch }
      }
    };
    if (draft !== undefined) {
      data.draft = draft;
    }
    if (reviewers !== undefined) {
      data.reviewers = BitbucketService.mapReviewers(reviewers);
    }
    if (closeSourceBranch !== undefined) {
      data.close_source_branch = closeSourceBranch;
    }

    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/pullrequests`, data);
    return response.data;
  }

  async updatePullRequest(
    repoName: string,
    prId: number,
    updates: { title?: string; description?: string; destinationBranch?: string; draft?: boolean; reviewers?: string[] }
  ): Promise<any> {
    const data: any = {};
    if (updates.title !== undefined) {
      data.title = updates.title;
    }
    if (updates.description !== undefined) {
      assertMarkdown(updates.description, 'description');
      data.description = updates.description;
    }
    if (updates.destinationBranch !== undefined) {
      data.destination = { branch: { name: updates.destinationBranch } };
    }
    if (updates.draft !== undefined) {
      data.draft = updates.draft;
    }
    if (updates.reviewers !== undefined) {
      data.reviewers = BitbucketService.mapReviewers(updates.reviewers);
    }

    const response = await this.client.put(`/repositories/${this.workspace}/${repoName}/pullrequests/${prId}`, data);
    return response.data;
  }

  async getCommits(repoName: string, branch: string = 'main', limit: number = 10): Promise<any[]> {
    const params = {
      pagelen: limit,
      include: branch
    };

    const response = await this.client.get(`/repositories/${this.workspace}/${repoName}/commits`, { params });
    return response.data.values;
  }

  async getFileContent(repoName: string, filePath: string, ref?: string, maxBytes: number = 200 * 1024): Promise<any> {
    if (!ref) {
      const repo = await this.client.get(`/repositories/${this.workspace}/${repoName}`);
      ref = repo.data.mainbranch?.name || 'main';
    }
    const response = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/src/${encodeURIComponent(ref!)}/${filePath}`,
      { responseType: 'arraybuffer' }
    );
    const buf = Buffer.from(response.data);
    const base = { path: filePath, ref, size: buf.length };
    if (buf.subarray(0, 8192).includes(0)) return { ...base, binary: true, content: null };
    const truncated = buf.length > maxBytes;
    return { ...base, truncated, content: buf.subarray(0, maxBytes).toString('utf8') };
  }

  async getPRDiffstat(repoName: string, prId: number): Promise<any> {
    const maxPages = 10; // ponytail: cap so huge PRs can't loop forever; truncated flag signals it
    let url: string | undefined = `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/diffstat`;
    let params: any = { pagelen: 100 };
    const files: any[] = [];
    let page = 0;
    while (url && page < maxPages) {
      const response: any = await this.client.get(url, { params });
      for (const f of response.data.values) {
        files.push({
          path: f.new?.path ?? f.old?.path,
          status: f.status,
          lines_added: f.lines_added,
          lines_removed: f.lines_removed,
        });
      }
      url = response.data.next;
      params = undefined; // `next` is a full URL carrying its own query
      page++;
    }
    return { files, count: files.length, truncated: !!url };
  }

  async getPRStatuses(repoName: string, prId: number): Promise<any> {
    const response = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/statuses`,
      { params: { pagelen: 50 } } // ponytail: first page only; PRs rarely have >50 statuses
    );
    const statuses = response.data.values.map((s: any) => ({
      key: s.key, name: s.name, state: s.state, url: s.url, updated_on: s.updated_on,
    }));
    const counts: Record<string, number> = {};
    for (const s of statuses) counts[s.state] = (counts[s.state] || 0) + 1;
    return {
      allSuccessful: statuses.length > 0 && statuses.every((s: any) => s.state === 'SUCCESSFUL'),
      counts,
      statuses,
    };
  }

  async getPipelines(repoName: string, branch?: string, limit: number = 10): Promise<any[]> {
    const params: any = { pagelen: Math.min(limit, 100), sort: '-created_on' }; // API max pagelen
    if (branch) params['target.branch'] = branch;
    const response = await this.client.get(`/repositories/${this.workspace}/${repoName}/pipelines/`, { params });
    return response.data.values.map((p: any) => ({
      uuid: p.uuid,
      build_number: p.build_number,
      state: p.state?.name,
      result: p.state?.result?.name ?? null,
      target: p.target?.ref_name,
      created_on: p.created_on,
      duration_in_seconds: p.duration_in_seconds ?? null,
    }));
  }

  async getPipelineSteps(repoName: string, pipelineUuid: string): Promise<any[]> {
    const response = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/pipelines/${encodeURIComponent(pipelineUuid)}/steps/`,
      { params: { pagelen: 100 } }
    );
    return response.data.values.map((s: any) => ({
      uuid: s.uuid,
      name: s.name,
      state: s.state?.name,
      result: s.state?.result?.name ?? null,
      started_on: s.started_on,
      completed_on: s.completed_on,
      duration_in_seconds: s.duration_in_seconds ?? null,
    }));
  }

  async getPipelineStepLog(repoName: string, pipelineUuid: string, stepUuid: string, maxBytes: number = 200 * 1024): Promise<any> {
    const response = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/pipelines/${encodeURIComponent(pipelineUuid)}/steps/${encodeURIComponent(stepUuid)}/log`,
      {
        responseType: 'arraybuffer',
        headers: { Range: `bytes=-${maxBytes}` }, // tail: failures are at the end
        validateStatus: (s) => (s >= 200 && s < 300) || s === 416, // 416 = empty log
      }
    );
    if (response.status === 416) return { truncated: false, log: '' };
    const buf = Buffer.from(response.data);
    // 206 is returned even when the whole log fits; only a non-zero start offset means we cut the head
    const rangeStart = Number(/bytes (\d+)-/.exec(response.headers['content-range'] ?? '')?.[1] ?? 0);
    const truncated = rangeStart > 0 || buf.length > maxBytes;
    return { truncated, log: buf.subarray(Math.max(0, buf.length - maxBytes)).toString('utf8') };
  }

  async getPRFileDiff(repoName: string, prId: number, path: string, maxBytes: number = 200 * 1024): Promise<any> {
    const response = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/diff`,
      { params: { path }, responseType: 'text' }
    );
    const diff: string = response.data;
    return { path, truncated: diff.length > maxBytes, diff: diff.slice(0, maxBytes) };
  }

  async createFile(
    repoName: string,
    filePath: string,
    content: string,
    message: string,
    branch: string = 'main'
  ): Promise<any> {
    const formData = new FormData();
    formData.append(filePath, content);
    formData.append('message', message);
    formData.append('branch', branch);

    const response = await this.client.post(
      `/repositories/${this.workspace}/${repoName}/src`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }

  async getIssues(repoName: string, state: string = 'open', limit: number = 10): Promise<any[]> {
    const params = {
      state: state.toLowerCase(),
      pagelen: limit,
      sort: '-updated_on'
    };

    const response = await this.client.get(`/repositories/${this.workspace}/${repoName}/issues`, { params });
    return response.data.values;
  }

  async createIssue(
    repoName: string,
    title: string,
    content: string = '',
    kind: string = 'bug'
  ): Promise<any> {
    assertMarkdown(content, 'content');
    const data = {
      title,
      content: { raw: content },
      kind,
      priority: 'major'
    };

    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/issues`, data);
    return response.data;
  }

  async getPRComments(repoName: string, prId: number): Promise<BitbucketPRComment[]> {
    const response = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/comments`,
      { params: { pagelen: 100 } }
    );
    return response.data.values.map(BitbucketService.mapComment);
  }

  async addPRComment(
    repoName: string,
    prId: number,
    content: string,
    inline?: { path: string; from?: number; to?: number },
    parentId?: number
  ): Promise<BitbucketPRComment> {
    assertMarkdown(content, 'content');
    const data: any = { content: { raw: content } };
    if (inline) {
      data.inline = inline;
    }
    if (parentId) {
      data.parent = { id: parentId };
    }
    const response = await this.client.post(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/comments`,
      data
    );
    return BitbucketService.mapComment(response.data);
  }

  async updatePRComment(
    repoName: string,
    prId: number,
    commentId: number,
    content: string
  ): Promise<BitbucketPRComment> {
    assertMarkdown(content, 'content');
    const response = await this.client.put(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/comments/${commentId}`,
      { content: { raw: content } }
    );
    return BitbucketService.mapComment(response.data);
  }

  async deletePRComment(repoName: string, prId: number, commentId: number): Promise<void> {
    await this.client.delete(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/comments/${commentId}`
    );
  }

  async resolvePRComment(repoName: string, prId: number, commentId: number): Promise<BitbucketPRComment> {
    await this.client.post(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/comments/${commentId}/resolve`,
      {}
    );
    const getResponse = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/comments/${commentId}`
    );
    return BitbucketService.mapComment(getResponse.data);
  }

  async unresolvePRComment(repoName: string, prId: number, commentId: number): Promise<BitbucketPRComment> {
    await this.client.delete(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/comments/${commentId}/resolve`
    );
    const getResponse = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/comments/${commentId}`
    );
    return BitbucketService.mapComment(getResponse.data);
  }

  // Bitbucket identifies reviewers by {uuid} (braced) or by account_id.
  private static mapReviewers(reviewers: string[]): Array<{ uuid: string } | { account_id: string }> {
    return reviewers.map(r => (r.startsWith('{') ? { uuid: r } : { account_id: r }));
  }

  private static mapPullRequestResult(response: any) {
    const pr = response.data;
    return {
      id: pr?.id,
      state: pr?.state,
      merge_commit: pr?.merge_commit?.hash,
      ...(response.status === 202 && { taskStatusUrl: response.headers?.location, note: 'Merge accepted and still in progress' }),
    };
  }

  async mergePR(
    repoName: string,
    prId: number,
    options: { mergeStrategy?: string; message?: string; closeSourceBranch?: boolean } = {}
  ) {
    const data: any = {};
    if (options.mergeStrategy !== undefined) data.merge_strategy = options.mergeStrategy;
    if (options.message !== undefined) {
      assertMarkdown(options.message, 'message');
      data.message = options.message;
    }
    if (options.closeSourceBranch !== undefined) data.close_source_branch = options.closeSourceBranch;
    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/merge`, data);
    return BitbucketService.mapPullRequestResult(response);
  }

  async declinePR(repoName: string, prId: number) {
    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/decline`, {});
    return BitbucketService.mapPullRequestResult(response);
  }

  private static mapParticipant(data: any): { approved: boolean; state: string | null; user?: string } {
    return { approved: data?.approved ?? false, state: data?.state ?? null, user: data?.user?.display_name };
  }

  async approvePR(repoName: string, prId: number) {
    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/approve`, {});
    return BitbucketService.mapParticipant(response.data);
  }

  async unapprovePR(repoName: string, prId: number) {
    await this.client.delete(`/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/approve`);
    return BitbucketService.mapParticipant(undefined);
  }

  async requestChangesPR(repoName: string, prId: number) {
    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/request-changes`, {});
    return BitbucketService.mapParticipant(response.data);
  }

  async removeChangeRequestPR(repoName: string, prId: number) {
    await this.client.delete(`/repositories/${this.workspace}/${repoName}/pullrequests/${prId}/request-changes`);
    return BitbucketService.mapParticipant(undefined);
  }
}