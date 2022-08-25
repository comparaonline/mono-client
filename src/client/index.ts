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
  IsSuccessfulCallbackReturn
} from '../interfaces';
import { InvalidMaxRetry, RequestFail, BodyParserFail } from '../exceptions';
import { delay } from '../helpers';

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

  constructor(private config: C) {
    this.client = config.type === 'rest' ? new RestClient(config) : new SoapClient(config);
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
    /* istanbul ignore next */
    if (this.config.retry == null) {
      return false;
    }
    if (request.shouldRetryCallback != null) {
      return request.shouldRetryCallback(request, response);
    }
    if (this.config.retry.shouldRetryCallback != null) {
      return this.config.retry.shouldRetryCallback(request, response);
    }
    if (
      this.config.retry.notOn != null &&
      this.matchStatusCode(response.statusCode, this.config.retry.notOn)
    ) {
      return false;
    }
    if (this.config.retry.on != null) {
      return this.matchStatusCode(response.statusCode, this.config.retry.on);
    }
    return true;
  }

  private isSuccessful(
    request: MonoClientRequest,
    response: MonoClientResponse
  ): IsSuccessfulCallbackReturn<Error> {
    if (request.isSuccessfulCallback != null) {
      return request.isSuccessfulCallback(response);
    }
    if (this.config.isSuccessfulCallback != null) {
      return this.config.isSuccessfulCallback(response);
    }
    if (response.statusCode === 200 || response.statusCode === 201) {
      return true;
    }
    return false;
  }

  private bodyParser(request: MonoClientRequest, response: MonoClientResponse): any {
    try {
      if (request.bodyParser != null) {
        return request.bodyParser(response.body);
      }
      if (this.config.bodyParser != null) {
        return this.config.bodyParser(response.body);
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
      if (
        this.config.retry != null &&
        this.config.retry.delayInSeconds != null &&
        this.config.retry.delayInSeconds > 0
      ) {
        await delay(this.config.retry.delayInSeconds);
      }
      return this.requestAttempt({ request, maxAttempt, attempt: attempt + 1 });
    }

    const error =
      isSuccessfulResponse instanceof Error
        ? isSuccessfulResponse
        : typeof isSuccessfulResponse === 'string'
        ? new Error(isSuccessfulResponse)
        : new Error(response.body != null ? JSON.stringify(response.body) : 'unknown error');

    throw new RequestFail(this.config.type, request, response, error);
  }

  async request<T>(params: R): Promise<TemplateResponse<T>> {
    const maxRetry = this.config.retry?.maxRetry ?? 0;
    if (maxRetry < 0) {
      throw new InvalidMaxRetry(maxRetry);
    }
    const maxAttempt = maxRetry + 1;
    return this.requestAttempt({ request: params as any, maxAttempt, attempt: 0 });
  }
}
