import { MonoClient } from '../client';
import { BaseClientConfig, Callback } from '../interfaces';

interface Params {
  businessUnit?: string;
  callback?: Callback;
}

export class MonoClientGenerator {
  constructor(private params: Params) {}

  get(
    params: BaseClientConfig,
    serviceId?: string | number,
    requestId?: string | number
  ): MonoClient {
    return new MonoClient({
      ...params,
      extra: {
        requestId,
        serviceId: serviceId,
        businessUnit: this.params.businessUnit
      },
      callback: this.params.callback
    });
  }
}
