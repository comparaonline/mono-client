import { MonoClient } from '../client';
import {
  RestBaseClientConfig,
  SoapBaseClientConfig,
  Callback,
  RestClientConfig,
  SoapClientConfig,
  RestRequest,
  SoapRequest,
  ServiceIdExtended
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
    params: SoapBaseClientConfig,
    serviceId?: ServiceIdExtended,
    requestId?: string | number
  ): MonoClient<SoapClientConfig, SoapRequest>;
  get(
    params: RestBaseClientConfig,
    serviceId?: ServiceIdExtended
  ): MonoClient<RestClientConfig, RestRequest>;
  get(
    params: SoapBaseClientConfig | RestBaseClientConfig,
    serviceId?: string | number | ServiceIdExtended,
    requestId?: string | number
  ): MonoClient<SoapClientConfig | RestClientConfig> {
    const extra = {
      requestId: isServiceIdExtended(serviceId) ? serviceId.requestId : requestId,
      serviceId: isServiceIdExtended(serviceId) ? serviceId.serviceId : serviceId,
      businessUnit: this.params.businessUnit,
      additionalData: isServiceIdExtended(serviceId) ? serviceId.additionalData : undefined
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
        bodyParser: params.bodyParser,
        avoidBodyParserExecution: params.avoidBodyParserExecution,
        avoidIsSuccessfulCallback: params.avoidIsSuccessfulCallback,
        errorHandler: params.errorHandler
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
        bodyParser: params.bodyParser,
        overwriteEndpoint: params.overwriteEndpoint,
        avoidBodyParserExecution: params.avoidBodyParserExecution,
        avoidIsSuccessfulCallback: params.avoidIsSuccessfulCallback,
        errorHandler: params.errorHandler
      });
    }
  }
}

function isServiceIdExtended(object: any): object is ServiceIdExtended {
  return typeof object === 'object' && object != null;
}
