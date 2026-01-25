import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ClientConfig {
  baseUrl: string;
  auth: string;
  serviceName: string;
}

/**
 * Base API client that provides common HTTP methods for all Atlassian services.
 * Eliminates code duplication across confluence-client, jira-client, and atlassian-client.
 */
export abstract class BaseApiClient {
  protected client: AxiosInstance;
  protected baseUrl: string;
  protected serviceName: string;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl;
    this.serviceName = config.serviceName;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Basic ${config.auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`${this.serviceName} API Error:`, error.response?.data || error.message);
        throw error;
      }
    );
  }

  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(endpoint);
    return response.data;
  }

  async postFormData<T>(endpoint: string, formData: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(endpoint, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Atlassian-Token': 'no-check',
      },
    });
    return response.data;
  }

  /**
   * For Bitbucket which needs access to the raw axios instance for custom requests
   */
  protected getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}
