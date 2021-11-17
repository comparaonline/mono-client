import { ClientConfig, Request, Response, Params } from '../interfaces';
import { join } from 'path';
import { MissingPathParameter } from '../exceptions';

export abstract class Client {
  constructor(public config: ClientConfig) {}
  protected generateUrl(basePath: string, path: string, pathParams: Params = {}): string {
    let baseUrl = join(basePath, path);
    const pendingParams = baseUrl.match(/{.*}/g) ?? [];
    for (const param of pendingParams) {
      if (pathParams[param] == null) {
        throw new MissingPathParameter(baseUrl, param);
      }
      baseUrl = baseUrl.replace(`{${param}}`, pathParams[param]);
    }
    return baseUrl;
  }
  abstract request(params: Request): Promise<Response>;
}
