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
import { InvalidMaxRetry, RequestFail } from '../exceptions';

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
  private matchStatusCode(currentStatus: number, matchs: StatusCode[]): boolean {
    if (matchs.includes(currentStatus)) {
      return true;
    }
    if (matchs.includes(StatusCode.S4XX) && currentStatus >= 400 && currentStatus < 500) {
      return true;
    }
    if (matchs.includes(StatusCode.S5XX) && currentStatus >= 500 && currentStatus < 600) {
      return true;
    }
    return false;
  }
  private shouldRetry(request: MonoClientRequest, response: MonoClientResponse): boolean {
    if (this.config.retry != null) {
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
    /* istanbul ignore next */
    return false;
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

  private async requestAttempt<T>({
    request,
    maxAttempt,
    attempt
  }: RequestAttempt): Promise<TemplateResponse<T>> {
    const startDate = new Date();
    const response = await this.client.request(request as any);
    const isSuccessfulResponse = this.isSuccessful(request, response);
    const isSuccessful = isSuccessfulResponse === true;
    if (this.config.callback != null) {
      this.config.callback(request, response, {
        requestId: this.config.extra?.requestId,
        serviceId: this.config.extra?.serviceId,
        businessUnit: this.config.extra?.businessUnit,
        requestDate: startDate,
        requestTime: Date.now() - startDate.getTime(),
        attempt: attempt + 1,
        isSuccessful
      });
    }
    if (isSuccessful) {
      return response;
    }

    if (attempt + 1 < maxAttempt && this.shouldRetry(request, response)) {
      return this.requestAttempt({ request, maxAttempt, attempt: attempt + 1 });
    }

    const error =
      isSuccessfulResponse instanceof Error
        ? isSuccessfulResponse
        : typeof isSuccessfulResponse === 'string'
        ? new Error(isSuccessfulResponse)
        : new Error(JSON.stringify(response.body) || 'unknown error');

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
