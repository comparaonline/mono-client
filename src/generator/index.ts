import { MonoClient } from '../client';
import { BaseClientConfig, Callback } from '../interfaces';

interface Params {
  serviceId?: string | number;
  callback?: Callback;
}

export class MonoClientGenerator {
  constructor(private params: Params) {}

  get(params: BaseClientConfig, requestId?: string | number): MonoClient {
    return new MonoClient({
      ...params,
      extra: {
        requestId,
        serviceId: this.params.serviceId
      },
      callback: this.params.callback
    });
  }
}
