import { ClientConfig, MonoClientRequest, MonoClientResponse, PathParams } from '../interfaces';
import { ClientBadConfiguration, MissingPathParameter } from '../exceptions';
import { Agent } from 'https';
import { readFile } from 'fs/promises';
import { join } from 'path';

export abstract class Client {
  constructor(public config: ClientConfig) {}

  protected DEFAULT_REQUEST_TIMEOUT = 120000;

  protected generateUrl(basePath: string, path: string, pathParams: PathParams = {}): string {
    const cleanPath = path ? `/${path.replace(/^[\/]/, '')}` : '';
    let baseUrl = `${basePath.replace(/[\/]$/, '')}${cleanPath}`;
    const pendingParams = baseUrl.match(/{.*}/g) ?? [];
    for (const curlyParam of pendingParams) {
      const param = curlyParam.replace(/[{}]/g, '');
      if (pathParams[param] == null) {
        throw new MissingPathParameter(baseUrl, param);
      }
      baseUrl = baseUrl.replace(curlyParam, String(pathParams[param]));
    }
    return baseUrl;
  }

  protected async readFile(pathOrBuffer: string | Buffer): Promise<Buffer> {
    return typeof pathOrBuffer === 'string'
      ? await readFile(join(process.cwd(), pathOrBuffer))
      : pathOrBuffer;
  }

  protected async getHttpsAgent(): Promise<Agent> {
    const ssl = this.config.ssl;
    /* istanbul ignore next */
    if (ssl == null) {
      throw new ClientBadConfiguration('HTTPS Agent requested without SSL configuration');
    }
    if (ssl.type === 'ssl-security') {
      const key = await this.readFile(ssl.key);
      const cert = await this.readFile(ssl.cert);
      const ca = ssl.ca == null ? ssl.ca : await this.readFile(ssl.ca);
      return new Agent({
        key,
        cert,
        ca,
        rejectUnauthorized: ssl.rejectUnauthorized
      });
    } else if (ssl.type === 'ssl-pfx-security') {
      const pfx = await this.readFile(ssl.pfx);
      return new Agent({
        pfx,
        passphrase: ssl.passphrase,
        rejectUnauthorized: ssl.rejectUnauthorized
      });
    } else {
      return new Agent({
        rejectUnauthorized: ssl.rejectUnauthorized
      });
    }
  }

  abstract request(params: MonoClientRequest): Promise<MonoClientResponse>;
}
