import axios, { AxiosInstance } from 'axios';
import { bitbucketConfig, getBitbucketAuth } from '../config.js';
import { BitbucketRepository, SearchOptions } from '../types.js';

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

    return response.data.values.map((repo: any) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      private: repo.is_private,
      createdOn: repo.created_on,
      updatedOn: repo.updated_on
    }));
  }

  async getRepository(repoName: string): Promise<BitbucketRepository> {
    const response = await this.client.get(`/repositories/${this.workspace}/${repoName}`);
    const repo = response.data;

    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      private: repo.is_private,
      createdOn: repo.created_on,
      updatedOn: repo.updated_on
    };
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
    const repo = response.data;

    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      language: repo.language || 'Unknown',
      private: repo.is_private,
      createdOn: repo.created_on,
      updatedOn: repo.updated_on
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
    description: string = ''
  ): Promise<any> {
    const data = {
      title,
      description,
      source: {
        branch: { name: sourceBranch }
      },
      destination: {
        branch: { name: destinationBranch }
      }
    };

    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/pullrequests`, data);
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

  async getFileContent(repoName: string, filePath: string, branch: string = 'main'): Promise<string> {
    const response = await this.client.get(
      `/repositories/${this.workspace}/${repoName}/src/${branch}/${filePath}`,
      { responseType: 'text' }
    );
    return response.data;
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
    const data = {
      title,
      content: { raw: content },
      kind,
      priority: 'major'
    };

    const response = await this.client.post(`/repositories/${this.workspace}/${repoName}/issues`, data);
    return response.data;
  }
}