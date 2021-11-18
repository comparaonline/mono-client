import { Client as BaseClient } from '../base-client';
import { Request, Response } from '../interfaces';
import { Client, createClientAsync } from 'soap';
import {
  ClientBadConfiguration,
  MissingMandatoryParamenter,
  MissingSoapMethod
} from '../exceptions';

interface SoapResponse {
  result: object;
  rawResponse: string;
  soapHeader?: { [key: string]: any };
  rawRequest: string;
}

export class SoapClient extends BaseClient {
  private soapClient: Client | null = null;
  private async getClient(params: Request): Promise<Client> {
    if (params.overwriteWsdl != null) {
      return await createClientAsync(params.overwriteWsdl, {
        wsdl_headers: params.headers
      });
    }
    if (this.config.type === 'soap' && this.config.wsdl != null) {
      if (this.soapClient == null) {
        this.soapClient = await createClientAsync(this.config.wsdl);
      }
      return this.soapClient;
    }
    throw new ClientBadConfiguration('Missing wsdl and overwriteWsdl');
  }
  private async soapRequest(client: Client, method: string, body: object): Promise<SoapResponse> {
    return new Promise((resolve, reject) => {
      client[method](
        body,
        (
          err: Error | null,
          result: object,
          rawResponse: string,
          soapHeader: object,
          rawRequest: string
        ): void => {
          if (err) {
            reject(err);
          } else {
            resolve({ result, rawResponse, soapHeader, rawRequest });
          }
        }
      );
    });
  }
  async request(params: Request): Promise<Response> {
    const client = await this.getClient(params);
    if (params.path == null || params.path.trim().length === 0) {
      throw new MissingMandatoryParamenter('path');
    }
    if (params.body == null || typeof params.body !== 'object') {
      throw new MissingMandatoryParamenter('body');
    }
    if (client[params.path] == null) {
      throw new MissingSoapMethod(params.path);
    }
    if (this.config.type === 'soap' && this.config.ssl != null) {
      client.setSecurity(this.config.ssl);
    }
    const results = await this.soapRequest(client, params.path, params.body);
    return {
      body: results.result,
      headers: results.soapHeader ?? {},
      statusCode: 200
    };
  }
}
