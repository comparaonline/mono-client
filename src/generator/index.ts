import { MonoClient } from '../client';
import {
  RestBaseClientConfig,
  SoapBaseClientConfig,
  Callback,
  RestClientConfig,
  SoapClientConfig,
  RestRequest,
  SoapRequest
} from '../interfaces';

interface Params {
  businessUnit?: string;
  callback?: Callback;
}

export class MonoClientGenerator {
  constructor(private params: Params) {}

  get(
    params: SoapBaseClientConfig,
    serviceId?: string | number,
    requestId?: string | number
  ): MonoClient<SoapClientConfig, SoapRequest>;
  get(
    params: RestBaseClientConfig,
    serviceId?: string | number,
    requestId?: string | number
  ): MonoClient<RestClientConfig, RestRequest>;
  get(
    params: SoapBaseClientConfig | RestBaseClientConfig,
    serviceId?: string | number,
    requestId?: string | number
  ): MonoClient<SoapClientConfig | RestClientConfig> {
    const extra = {
      requestId,
      serviceId: serviceId,
      businessUnit: this.params.businessUnit
    };
    if (params.type === 'rest') {
      return new MonoClient<RestClientConfig>({
        type: 'rest',
        baseUrl: params.baseUrl,
        isSuccessfulCallback: params.isSuccessfulCallback,
        retry: params.retry,
        ssl: params.ssl,
        extra,
        callback: this.params.callback,
        bodyParser: params.bodyParser
      });
    } else {
      return new MonoClient<SoapClientConfig>({
        type: 'soap',
        isSuccessfulCallback: params.isSuccessfulCallback,
        retry: params.retry,
        ssl: params.ssl,
        wsdl: params.wsdl,
        extra,
        callback: this.params.callback,
        bodyParser: params.bodyParser
      });
    }
  }
}
