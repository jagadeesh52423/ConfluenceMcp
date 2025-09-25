import { ConfluenceClient } from '../confluence-client.js';
import { ConfluencePage, SearchOptions } from '../types.js';

export class ConfluenceService {
  private client: ConfluenceClient;

  constructor() {
    this.client = new ConfluenceClient();
  }

  async searchPages(options: SearchOptions = {}): Promise<ConfluencePage[]> {
    const { query, limit = 25, startAt = 0, expand = ['body.storage', 'version', 'space'] } = options;

    let cql = '';
    if (query) {
      cql = `text ~ "${query}"`;
    }

    const params: any = {
      cql,
      limit,
      start: startAt,
      expand: expand.join(',')
    };

    const response = await this.client.get<any>('/wiki/rest/api/content/search', params);

    return response.results.map((page: any) => ({
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || '',
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    }));
  }

  async getPage(pageId: string, expand: string[] = ['body.storage', 'version', 'space']): Promise<ConfluencePage> {
    const params = {
      expand: expand.join(',')
    };

    const page = await this.client.get<any>(`/wiki/rest/api/content/${pageId}`, params);

    return {
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || '',
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    };
  }

  async createPage(spaceKey: string, title: string, content: string, parentId?: string): Promise<ConfluencePage> {
    const data: any = {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };

    if (parentId) {
      data.ancestors = [{ id: parentId }];
    }

    const page = await this.client.post<any>('/wiki/rest/api/content', data);

    return {
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || '',
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    };
  }

  async updatePage(pageId: string, title: string, content: string, version: number): Promise<ConfluencePage> {
    const data = {
      version: { number: version + 1 },
      title,
      type: 'page',
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };

    const page = await this.client.put<any>(`/wiki/rest/api/content/${pageId}`, data);

    return {
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || '',
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    };
  }

  async deletePage(pageId: string): Promise<void> {
    await this.client.delete(`/wiki/rest/api/content/${pageId}`);
  }

  async getSpaces(limit: number = 25): Promise<any[]> {
    const params = {
      limit,
      expand: 'description.plain'
    };

    const response = await this.client.get<any>('/wiki/rest/api/space', params);
    return response.results;
  }

  async getPagesBySpace(spaceKey: string, limit: number = 25): Promise<ConfluencePage[]> {
    const params = {
      spaceKey,
      limit,
      expand: 'body.storage,version'
    };

    const response = await this.client.get<any>('/wiki/rest/api/content', params);

    return response.results.map((page: any) => ({
      id: page.id,
      title: page.title,
      content: page.body?.storage?.value || '',
      spaceKey: page.space?.key || spaceKey,
      version: page.version?.number || 1,
      created: page.created || '',
      updated: page.updated || ''
    }));
  }
}