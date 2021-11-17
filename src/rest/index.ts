import axios, { AxiosError } from 'axios';
import { Client } from '../base-client';
import { ClientBadConfiguration } from '../exceptions';
import { Request, Response } from '../interfaces';

export class RestClient extends Client {
  async request(params: Request): Promise<Response> {
    if (this.config.type !== 'rest') {
      throw new ClientBadConfiguration('Missing config type');
    }
    const baseUrl = params.overwriteBaseUrl ?? this.config.baseUrl;
    if (baseUrl == null) {
      throw new ClientBadConfiguration('Missing baseUrl and overwriteBaseUrl');
    }
    try {
      const response = await axios({
        method: params.method,
        url: this.generateUrl(baseUrl, params.path, params.pathParams),
        params: params.queryParams,
        data: params.body,
        headers: params.headers
      });
      return {
        body: response.data,
        headers: response.headers,
        statusCode: response.status
      };
    } catch (e: any) {
      const error: AxiosError = e;
      return {
        body: error.response?.data,
        headers: error.response?.headers ?? {},
        statusCode: error.response?.status ?? 500
      };
    }
  }
}
