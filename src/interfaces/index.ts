import { Method } from 'axios';
import { ClientSSLSecurity, ClientSSLSecurityPFX } from 'soap';
export { ClientSSLSecurity, ClientSSLSecurityPFX };

export type Params = { [key: string]: string | number };

export enum StatusCode {
  S4XX = '4XX',
  E400 = 400,
  E401 = 401,
  E402 = 402,
  E403 = 403,
  E404 = 404,
  E405 = 405,
  E406 = 406,
  E407 = 407,
  E408 = 408,
  E409 = 409,
  E410 = 410,
  E411 = 411,
  E412 = 412,
  E413 = 413,
  E414 = 414,
  E415 = 415,
  E416 = 416,
  E417 = 417,
  E418 = 418,
  E421 = 421,
  E422 = 422,
  E423 = 423,
  E424 = 424,
  E425 = 425,
  E426 = 426,
  E428 = 428,
  E429 = 429,
  E431 = 431,
  E451 = 451,
  S5XX = '5XX',
  E500 = 500,
  E501 = 501,
  E502 = 502,
  E503 = 503,
  E504 = 504,
  E505 = 505,
  E506 = 506,
  E507 = 507,
  E508 = 508,
  E510 = 510,
  E511 = 511
}

export interface Headers {
  [key: string]: string;
}

export interface Request {
  path: string;
  overwriteBaseUrl?: string;
  overwriteWsdl?: string;
  method?: Method;
  pathParams?: Params;
  queryParams?: Params;
  body?: any;
  headers?: Headers;
}

export interface Response {
  body: any;
  headers: Headers;
  statusCode: number;
  message?: string;
}

export interface Extra {
  requestId?: string | number;
  businessUnit?: string;
  serviceId?: string | number;
}

export interface Info extends Extra {
  requestTime: number;
  requestDate: Date;
  attempt: number;
  isSuccessful: boolean;
}

export interface Retry {
  maxRetry: number;
  on?: StatusCode[];
  notOn?: StatusCode[];
  callbackRetry?: (request: Request, response: Response) => boolean;
  extra?: Extra;
}

export type Callback = (request: Request, response: Response, info: Info) => Promise<void> | void;

interface MCBaseClientConfig {
  retry?: Retry;
  isSuccessfulCallback?: (response: Response) => boolean;
}

interface BaseClientConfigSoap extends MCBaseClientConfig {
  type: 'soap';
  wsdl?: string;
  ssl?: ClientSSLSecurity | ClientSSLSecurityPFX;
}

interface BaseClientConfigRest extends MCBaseClientConfig {
  type: 'rest';
  baseUrl?: string;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

export type BaseClientConfig = BaseClientConfigSoap | BaseClientConfigRest;

export type ClientConfig = BaseClientConfig & {
  callback?: Callback;
  extra?: Extra;
};
