import { Method, ResponseType } from 'axios';
import { IOptions } from 'soap';

export type PathParams = { [key: string]: string | number };
export type QueryParams = { [key: string]: string | number | string[] | number[] };

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

export interface HttpBasicSecurity {
  basic: {
    username: string;
    password: string;
  };
}

export interface HttpBearerSecurity {
  /** Put the token without Bearer prefix */
  bearer: string;
}

export type HttpSecurity = HttpBasicSecurity | HttpBearerSecurity;

interface BaseRequest {
  headers?: Headers;
  /** Request timeout in ms, default to 120000 **/
  requestTimeout?: number;
  isSuccessfulCallback?: IsSuccessfulCallback<Error>;
  shouldRetryCallback?: shouldRetryCallback;
  callback?: Callback;
  bodyParser?: BodyParser;
  avoidBodyParserExecution?: boolean;
  avoidIsSuccessfulCallback?: boolean;
  errorHandler?: ErrorHandler;
  security?: HttpSecurity;
}

export interface SoapRequest extends BaseRequest {
  body: object;
  overwriteWsdl?: string;
  method: string;
  additionalRequestOptions?: IOptions;
  overwriteEndpoint?: string;
  soapHeaders?: Record<string, any>;
}

export interface RestRequest extends BaseRequest {
  path: string;
  overwriteBaseUrl?: string;
  method?: Method;
  pathParams?: PathParams;
  queryParams?: QueryParams;
  body?: any;
  responseType?: ResponseType;
}

export type MonoClientRequest = SoapRequest | RestRequest;

export interface MonoClientResponse {
  body: any;
  headers: Headers;
  statusCode: number;
  message?: string;
  url: string;
  raw: {
    request: string;
    response: string;
  };
}

export interface Extra {
  requestId?: string | number;
  businessUnit?: string;
  serviceId?: string | number;
  additionalData?: object;
}

export interface Info extends Extra {
  requestTime: number;
  requestDate: Date;
  attempt: number;
  isSuccessful: boolean;
}

export type IsSuccessfulCallbackReturn<T extends Error> = boolean | T | string;
type shouldRetryCallback = (request: MonoClientRequest, response: MonoClientResponse) => boolean;
type IsSuccessfulCallback<T extends Error> = (
  response: MonoClientResponse
) => IsSuccessfulCallbackReturn<T>;

export interface Retry {
  maxRetry: number;
  on?: StatusCode[];
  notOn?: StatusCode[];
  shouldRetryCallback?: shouldRetryCallback;
  delayInSeconds?: number;
}

export type Callback = (
  request: MonoClientRequest,
  response: MonoClientResponse,
  info: Info
) => Promise<void> | void;

export type BodyParser = (body: any, response: MonoClientResponse) => any;

export type ErrorHandler = (response: MonoClientResponse) => Error | string;

interface MCBaseClientConfig {
  retry?: Retry;
  isSuccessfulCallback?: IsSuccessfulCallback<Error>;
  ssl?: SSL;
  bodyParser?: BodyParser;
  /** Default true - Prevent bodyParser execution if status code different from 200 or 201 */
  avoidBodyParserExecution?: boolean;
  /** Default true - Prevent isSuccessfulCallback execution if status code different from 200 or 201 */
  avoidIsSuccessfulCallback?: boolean;
  /** If avoidIsSuccessfulCallback is true you can use this callback to return the correct error message */
  errorHandler?: ErrorHandler;
  security?: HttpSecurity;
}

export interface SslSecurity {
  type: 'ssl-security';
  /** Buffer or path, path will use process.cwd to get absolute path. If undefined then empty string will be used as key */
  key?: string | Buffer;
  /** Buffer or path, path will use process.cwd to get absolute path */
  cert: string | Buffer;
  /** Buffer or path, path will use process.cwd to get absolute path */
  ca?: Buffer | string;
  rejectUnauthorized?: boolean;
}

export interface SslPfxSecurity {
  type: 'ssl-pfx-security';
  /** Buffer or path, path will use process.cwd to get absolute path */
  pfx: string | Buffer;
  passphrase?: string;
  rejectUnauthorized?: boolean;
}

export interface SSLReject {
  type: 'ssl-reject';
  rejectUnauthorized: boolean;
}

type SSL = SslSecurity | SslPfxSecurity | SSLReject;

export interface SoapBaseClientConfig extends MCBaseClientConfig {
  type: 'soap';
  wsdl?: string;
  overwriteEndpoint?: string;
}

export interface RestBaseClientConfig extends MCBaseClientConfig {
  type: 'rest';
  baseUrl?: string;
}

interface ExtendedConfig {
  callback?: Callback;
  extra?: Extra;
}

export type BaseClientConfig = SoapBaseClientConfig | RestBaseClientConfig;

export type SoapClientConfig = SoapBaseClientConfig & ExtendedConfig;
export type RestClientConfig = RestBaseClientConfig & ExtendedConfig;

export type ClientConfig = SoapClientConfig | RestClientConfig;

export interface RequestInformation {
  serviceId?: string;
  requestId?: string;
  additionalData?: object;
}
