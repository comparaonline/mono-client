import axios, { AxiosError } from 'axios';
import { Client } from '../base-client';
import { ClientBadConfiguration } from '../exceptions';
import { RestClientConfig, RestRequest, MonoClientResponse } from '../interfaces';

export class RestClient extends Client {
  constructor(public config: RestClientConfig) {
    super(config);
  }
  async request(params: RestRequest): Promise<MonoClientResponse> {
    const baseUrl = params.overwriteBaseUrl ?? this.config.baseUrl;
    if (baseUrl == null) {
      throw new ClientBadConfiguration('Missing baseUrl and overwriteBaseUrl');
    }
    const url = this.generateUrl(baseUrl, params.path, params.pathParams);
    try {
      const response = await axios.request({
        url,
        method: params.method,
        params: params.queryParams,
        data: params.body,
        headers: params.headers
      });
      return {
        body: response.data,
        headers: response.headers,
        statusCode: response.status,
        raw: {
          request: typeof params.body === 'object' ? JSON.stringify(params.body) : '',
          response: typeof response.data === 'object' ? JSON.stringify(response.data) : ''
        }
      };
    } catch (e: any) {
      const error: AxiosError = e;
      const body = error.response?.data;
      return {
        body,
        headers: error.response?.headers ?? {},
        statusCode: error.response?.status ?? 500,
        message: error.message,
        raw: {
          request: typeof params.body === 'object' ? JSON.stringify(params.body) : '',
          response: typeof body === 'object' ? JSON.stringify(body) : ''
        }
      };
    }
  }
}
