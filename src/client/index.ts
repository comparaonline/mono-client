import { SoapClient } from '../soap';
import { RestClient } from '../rest';
import { ClientConfig, Request, Response, StatusCode } from '../interfaces';
import { InvalidMaxRetry, RequestFail } from '../exceptions';

interface TemplateResponse<T> extends Omit<Response, 'body'> {
  body: T;
}

interface RequestAttempt {
  request: Request;
  maxAttempt: number;
  attempt: number;
}

export class MonoClient {
  private client: SoapClient | RestClient;
  constructor(private readonly config: ClientConfig) {
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
  private shouldRetry(request: Request, response: Response): boolean {
    if (this.config.retry != null) {
      if (this.config.retry.callbackRetry != null) {
        return this.config.retry.callbackRetry(request, response);
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
  private isSuccessful(response: Response): boolean {
    if (this.config.isSuccessfulCallback != null && this.config.isSuccessfulCallback(response)) {
      return true;
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
    const response = await this.client.request(request);
    if (this.config.callback != null) {
      this.config.callback(request, response, {
        requestId: this.config.extra?.requestId,
        serviceId: this.config.extra?.serviceId,
        businessUnit: this.config.extra?.businessUnit,
        requestDate: startDate,
        requestTime: Date.now() - startDate.getTime(),
        attempt: attempt + 1,
        isSuccessful: this.isSuccessful(response)
      });
    }
    if (this.isSuccessful(response)) {
      return response;
    }
    if (attempt + 1 < maxAttempt && this.shouldRetry(request, response)) {
      return this.requestAttempt({ request, maxAttempt, attempt: attempt + 1 });
    }
    throw new RequestFail(request, response);
  }

  async request<T>(params: Request): Promise<TemplateResponse<T>> {
    const maxRetry = this.config.retry?.maxRetry ?? 0;
    if (maxRetry < 0) {
      throw new InvalidMaxRetry(maxRetry);
    }
    const maxAttempt = maxRetry + 1;
    return this.requestAttempt({ request: params, maxAttempt, attempt: 0 });
  }
}
