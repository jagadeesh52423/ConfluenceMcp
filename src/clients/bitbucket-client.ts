import { BaseApiClient } from './base-client.js';
import { bitbucketConfig, getBitbucketAuth } from '../config.js';
import { SERVICE_NAMES, API_ENDPOINTS } from '../constants.js';
import { AxiosInstance } from 'axios';

/**
 * Bitbucket API client extending the base client
 */
export class BitbucketClient extends BaseApiClient {
  public readonly workspace: string;

  constructor() {
    super({
      baseUrl: API_ENDPOINTS.BITBUCKET_BASE_URL,
      auth: getBitbucketAuth(),
      serviceName: SERVICE_NAMES.BITBUCKET,
    });
    this.workspace = bitbucketConfig.workspace;
  }

  /**
   * Get raw text content (for diffs and file contents)
   */
  async getRawText(endpoint: string): Promise<string> {
    const response = await this.getAxiosInstance().get(endpoint, { responseType: 'text' });
    return response.data;
  }

  /**
   * Post form data for file uploads
   */
  async postMultipartFormData(endpoint: string, formData: FormData): Promise<any> {
    const response = await this.getAxiosInstance().post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}
