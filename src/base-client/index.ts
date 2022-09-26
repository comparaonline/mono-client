import {
  ClientConfig,
  HttpBasicSecurity,
  HttpBearerSecurity,
  MonoClientRequest,
  MonoClientResponse,
  PathParams
} from '../interfaces';
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
    const pendingParams = baseUrl.match(/{(.*?)}/g) ?? [];
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
      const cert = await this.readFile(ssl.cert);
      const key = ssl.key != null ? await this.readFile(ssl.key) : '';
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

  protected getAuthorizationHeader(params: MonoClientRequest): string | null {
    const security = params.security ?? this.config.security;
    if (this.isBasicSecurity(security)) {
      return `Basic ${Buffer.from(`${security.basic.username}:${security.basic.password}`).toString(
        'base64'
      )}`;
    }
    if (this.isBearerSecurity(security)) {
      return `Bearer ${security.bearer.replace(/bearer /i, '')}`;
    }
    return null;
  }

  private isBasicSecurity(security: any): security is HttpBasicSecurity {
    return (
      security != null &&
      security.basic != null &&
      security.basic.username != null &&
      security.basic.password != null
    );
  }

  private isBearerSecurity(security: any): security is HttpBearerSecurity {
    return security != null && security.bearer != null;
  }

  abstract request(params: MonoClientRequest): Promise<MonoClientResponse>;
}
