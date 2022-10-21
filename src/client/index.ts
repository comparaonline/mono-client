import { SoapClient } from '../soap';
import { RestClient } from '../rest';
import {
  RestClientConfig,
  SoapClientConfig,
  MonoClientRequest,
  RestRequest,
  SoapRequest,
  MonoClientResponse,
  StatusCode,
  IsSuccessfulCallbackReturn,
  Retry
} from '../interfaces';
import { InvalidMaxRetry, RequestFail, BodyParserFail } from '../exceptions';
import { delay, toNonCircularObject } from '../helpers';

const SUCCESS_STATUS_CODE = [200, 201, 202];
interface TemplateResponse<T> extends Omit<MonoClientResponse, 'body'> {
  body: T;
}

interface RequestAttempt {
  request: MonoClientRequest;
  maxAttempt: number;
  attempt: number;
}

export class MonoClient<
  C extends RestClientConfig | SoapClientConfig,
  R = C extends SoapClientConfig ? SoapRequest : RestRequest
> {
  private client: SoapClient | RestClient;
  private retry: Retry;

  constructor(private config: C) {
    this.client = config.type === 'rest' ? new RestClient(config) : new SoapClient(config);
    this.retry = this.config.retry ?? { maxRetry: 0 };
  }

  private matchStatusCode(currentStatus: number, matches: StatusCode[]): boolean {
    if (matches.includes(currentStatus)) {
      return true;
    }
    if (matches.includes(StatusCode.S4XX) && currentStatus >= 400 && currentStatus < 500) {
      return true;
    }
    if (matches.includes(StatusCode.S5XX) && currentStatus >= 500 && currentStatus < 600) {
      return true;
    }
    return false;
  }

  private shouldRetry(request: MonoClientRequest, response: MonoClientResponse): boolean {
    if (request.shouldRetryCallback != null) {
      return request.shouldRetryCallback(request, response);
    }
    if (this.retry.shouldRetryCallback != null) {
      return this.retry.shouldRetryCallback(request, response);
    }
    if (this.retry.notOn != null && this.matchStatusCode(response.statusCode, this.retry.notOn)) {
      return false;
    }
    if (this.retry.on != null) {
      return this.matchStatusCode(response.statusCode, this.retry.on);
    }
    return true;
  }

  private isErrorStatusCode(response: MonoClientResponse): boolean {
    return !SUCCESS_STATUS_CODE.includes(response.statusCode);
  }

  private isSuccessful(
    request: MonoClientRequest,
    response: MonoClientResponse
  ): IsSuccessfulCallbackReturn<Error> {
    const avoidIsSuccessfulCallback =
      request.avoidIsSuccessfulCallback ?? this.config.avoidIsSuccessfulCallback ?? true;
    if (this.isErrorStatusCode(response) && avoidIsSuccessfulCallback) {
      const errorHandler = request.errorHandler ?? this.config.errorHandler;
      if (errorHandler != null) {
        try {
          return errorHandler(response);
        } catch (e: any) {
          return e as Error;
        }
      }
      return false;
    }
    try {
      if (request.isSuccessfulCallback != null) {
        return request.isSuccessfulCallback(response);
      }
      if (this.config.isSuccessfulCallback != null) {
        return this.config.isSuccessfulCallback(response);
      }
    } catch (e: any) {
      return e as Error;
    }
    if (!this.isErrorStatusCode(response)) {
      return true;
    }
    return false;
  }

  private bodyParser(request: MonoClientRequest, response: MonoClientResponse): any {
    const avoidBodyParserExecution =
      request.avoidBodyParserExecution ?? this.config.avoidBodyParserExecution ?? true;
    if (this.isErrorStatusCode(response) && avoidBodyParserExecution) {
      return response.body;
    }
    try {
      if (request.bodyParser != null) {
        return request.bodyParser(response.body, response);
      }
      if (this.config.bodyParser != null) {
        return this.config.bodyParser(response.body, response);
      }
    } catch (e: any) {
      return new BodyParserFail(this.config.type, request, response, e);
    }
    return response.body;
  }

  private async requestAttempt<T>({
    request,
    maxAttempt,
    attempt
  }: RequestAttempt): Promise<TemplateResponse<T>> {
    const startDate = new Date();
    const response = await this.client.request(request as any);
    const bodyParsed = this.bodyParser(request, response);
    const isSuccessfulResponse =
      bodyParsed instanceof BodyParserFail
        ? false
        : this.isSuccessful(request, { ...response, body: bodyParsed });
    const isSuccessful = isSuccessfulResponse === true;
    const callback = request.callback ?? this.config.callback;
    if (callback != null) {
      callback(request, response, {
        requestId: this.config.extra?.requestId,
        serviceId: this.config.extra?.serviceId,
        businessUnit: this.config.extra?.businessUnit,
        additionalData: this.config.extra?.additionalData,
        requestDate: startDate,
        requestTime: Date.now() - startDate.getTime(),
        attempt: attempt + 1,
        isSuccessful
      });
    }
    if (bodyParsed instanceof BodyParserFail) {
      throw bodyParsed;
    }
    response.body = bodyParsed;
    if (isSuccessful) {
      return response;
    }

    if (attempt + 1 < maxAttempt && this.shouldRetry(request, response)) {
      if (this.retry.delayInSeconds != null && this.retry.delayInSeconds > 0) {
        await delay(this.retry.delayInSeconds);
      }
      return this.requestAttempt({ request, maxAttempt, attempt: attempt + 1 });
    }

    const error =
      isSuccessfulResponse instanceof Error
        ? isSuccessfulResponse
        : typeof isSuccessfulResponse === 'string'
        ? new Error(isSuccessfulResponse)
        : new Error(
            response.body != null
              ? JSON.stringify(toNonCircularObject(response.body))
              : 'unknown error'
          );

    throw new RequestFail(this.config.type, request, response, error);
  }

  async request<T>(params: R): Promise<TemplateResponse<T>> {
    if (this.retry.maxRetry < 0) {
      throw new InvalidMaxRetry(this.retry.maxRetry);
    }
    const maxAttempt = this.retry.maxRetry + 1;
    return this.requestAttempt({ request: params as any, maxAttempt, attempt: 0 });
  }
}
