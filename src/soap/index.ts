import { Client as BaseClient } from '../base-client';
import { SoapClientConfig, SoapRequest, MonoClientResponse, Headers } from '../interfaces';
import { Client, createClientAsync } from 'soap';
import {
  ClientBadConfiguration,
  MissingMandatoryParamenter,
  MissingSoapMethod
} from '../exceptions';
import axios from 'axios';

interface SoapError {
  root: object;
  response: {
    status: number;
    statusText: null | string;
    headers: Headers;
    config: {
      url: string;
      method: string;
      data: string;
      headers: Headers;
      timeout: number;
    };
    request: {
      path: string;
      headers: Headers;
    };
    data: string;
  };
  body: string;
}

interface SoapResponse {
  result: object;
  rawResponse: string;
  soapHeader?: { [key: string]: any };
  rawRequest: string;
  statusCode: number;
}

export class SoapClient extends BaseClient {
  private soapClient: Client | null = null;
  constructor(public config: SoapClientConfig) {
    super(config);
  }
  private async getRequestAgentConfig(): Promise<any> {
    return this.config.ssl
      ? {
          request: axios.create({
            httpsAgent: await this.getHttpsAgent()
          })
        }
      : {};
  }
  private async getClient(params: SoapRequest): Promise<Client> {
    const options = {
      wsdl_headers: params.headers,
      ...(await this.getRequestAgentConfig())
    };
    if (params.overwriteWsdl != null) {
      return await createClientAsync(params.overwriteWsdl, options);
    }
    if (this.config.wsdl != null) {
      if (this.soapClient == null) {
        this.soapClient = await createClientAsync(this.config.wsdl, options);
      }
      return this.soapClient;
    }
    throw new ClientBadConfiguration('Missing wsdl and overwriteWsdl');
  }
  private async soapRequest(client: Client, method: string, body: object): Promise<SoapResponse> {
    return new Promise((resolve) => {
      client[method](
        body,
        (
          err: SoapError | null,
          result: object,
          rawResponse: string,
          soapHeader: object,
          rawRequest: string
        ): void => {
          if (err != null) {
            /* istanbul ignore next */
            resolve({
              statusCode: err?.response?.status ?? 500,
              result: err?.root ?? {},
              rawResponse: err?.body ?? '',
              rawRequest: err?.response?.config?.data ?? '',
              soapHeader: err?.response?.headers ?? {}
            });
          } else {
            resolve({ result, rawResponse, soapHeader, rawRequest, statusCode: 200 });
          }
        }
      );
    });
  }
  async request(params: SoapRequest): Promise<MonoClientResponse> {
    const client = await this.getClient(params);
    if (params.method == null || params.method.trim().length === 0) {
      throw new MissingMandatoryParamenter('method');
    }
    if (client[params.method] == null) {
      throw new MissingSoapMethod(params.method);
    }
    const results = await this.soapRequest(client, params.method, params.body);
    return {
      body: results.result,
      headers: results.soapHeader ?? {},
      statusCode: results.statusCode,
      raw: {
        request: results.rawRequest,
        response: results.rawResponse
      }
    };
  }
}
