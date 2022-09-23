import { MonoClient } from '../client';
import {
  RestBaseClientConfig,
  SoapBaseClientConfig,
  Callback,
  RestClientConfig,
  SoapClientConfig,
  RestRequest,
  SoapRequest,
  RequestInformation
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
    information?: RequestInformation
  ): MonoClient<SoapClientConfig, SoapRequest>;
  get(
    params: RestBaseClientConfig,
    information?: RequestInformation
  ): MonoClient<RestClientConfig, RestRequest>;
  get(
    params: SoapBaseClientConfig | RestBaseClientConfig,
    informationOrServiceId?: string | number | RequestInformation,
    requestId?: string | number
  ): MonoClient<SoapClientConfig | RestClientConfig> {
    const extra = {
      requestId: isRequestInformation(informationOrServiceId)
        ? informationOrServiceId.requestId
        : requestId,
      serviceId: isRequestInformation(informationOrServiceId)
        ? informationOrServiceId.serviceId
        : informationOrServiceId,
      businessUnit: this.params.businessUnit,
      additionalData: isRequestInformation(informationOrServiceId)
        ? informationOrServiceId.additionalData
        : undefined
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
        errorHandler: params.errorHandler,
        security: params.security
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
        errorHandler: params.errorHandler,
        security: params.security
      });
    }
  }
}

function isRequestInformation(object: any): object is RequestInformation {
  return typeof object === 'object' && object != null;
}
