import axios, { AxiosError, ResponseType } from 'axios';
import { Client } from '../base-client';
import { ClientBadConfiguration } from '../exceptions';
import { toNonCircularObject } from '../helpers';
import { RestClientConfig, RestRequest, MonoClientResponse } from '../interfaces';

function toJson(object: any, responseType?: ResponseType): string {
  try {
    if (typeof object !== 'object' || object == null) {
      return String(object ?? '');
    }
    if (responseType === 'stream') {
      return JSON.stringify(toNonCircularObject(object));
    } else {
      return JSON.stringify(object);
    }
  } catch (e: any) {
    /* istanbul ignore next */
    return e.message;
  }
}

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

    const authorizationHeader = this.getAuthorizationHeader(params);
    if (authorizationHeader != null) {
      if (params.headers == null) {
        params.headers = {};
      }
      params.headers.Authorization = authorizationHeader;
    }
    try {
      const response = await axios.request({
        url,
        method: params.method,
        params: params.queryParams,
        data: params.body,
        headers: params.headers,
        httpsAgent: this.config.ssl ? await this.getHttpsAgent() : undefined,
        timeout: params.requestTimeout ?? this.DEFAULT_REQUEST_TIMEOUT,
        responseType: params.responseType
      });
      return {
        body: response.data,
        headers: response.headers,
        statusCode: response.status,
        raw: {
          request: toJson(params.body, params.responseType),
          response: toJson(response.data, params.responseType)
        },
        url: response.request?._redirectable?._currentUrl ?? url
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
          request: toJson(params.body, params.responseType),
          response: toJson(body, params.responseType)
        },
        url: error.response?.request?._redirectable?._currentUrl ?? url
      };
    }
  }
}
