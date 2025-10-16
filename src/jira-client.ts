import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { jiraConfig, getJiraAuth } from './config.js';

export class JiraClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://${jiraConfig.domain}`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Basic ${getJiraAuth()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Jira API Error:', error.response?.data || error.message);
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
}