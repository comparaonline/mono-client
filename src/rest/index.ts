import axios, { AxiosError } from 'axios';
import { Client } from '../base-client';
import { ClientBadConfiguration } from '../exceptions';
import { safeJsonParse, toNonCircularObject } from '../helpers';
import { RestClientConfig, RestRequest, MonoClientResponse, RestResponseType } from '../interfaces';
import { SimpleStream } from '../simple-stream';

function toJson(object: any, responseType?: RestResponseType): string {
  try {
    if (typeof object !== 'object' || object == null) {
      return String(object ?? '');
    }
    if (responseType === 'stream') {
      return JSON.stringify(toNonCircularObject(object));
    } else {
      return JSON.stringify(object);
    }
  } catch (e: any) {
    /* istanbul ignore next */
    return e.message;
  }
}

export class RestClient extends Client {
  constructor(public config: RestClientConfig) {
    super(config);
  }
  async request(params: RestRequest): Promise<MonoClientResponse> {
    const baseUrl = params.overwriteBaseUrl ?? this.config.baseUrl;
    if (baseUrl == null) {
      throw new ClientBadConfiguration('Missing baseUrl and overwriteBaseUrl');
    }
    const url = this.generateUrl(baseUrl, params.path, params.pathParams);

    const authorizationHeader = this.getAuthorizationHeader(params);
    if (authorizationHeader != null) {
      if (params.headers == null) {
        params.headers = {};
      }
      params.headers.Authorization = authorizationHeader;
    }
    try {
      const response = await axios.request({
        url,
        method: params.method,
        params: params.queryParams,
        data: params.body,
        headers: params.headers,
        httpsAgent: this.config.ssl ? await this.getHttpsAgent() : undefined,
        timeout: params.requestTimeout ?? this.DEFAULT_REQUEST_TIMEOUT,
        // JSON stream doesn't exists, it's just stream but we will handle it and return a simpler logic
        responseType: params.responseType === 'json-stream' ? 'stream' : params.responseType
      });

      let body = response.data;

      // Handle json stream
      if (params.responseType === 'json-stream') {
        // Use a separated constant to avoid TS conflicts
        const emitter = new SimpleStream();
        // Return this stream to avoid the need of handle error and end by separated. In our case we will get a lot of timeout (error) but it will be enough for us
        body = emitter;
        /* istanbul ignore next */
        response.data.on('error', () => emitter.emitEnd());
        response.data.on('end', () => emitter.emitEnd());

        // All of our JSON will end here
        let stringQueue = '';

        const parseAndSendData = (): void => {
          // This regex will look for any }{ (with or without new line in the middle)
          const regex = /}{|}\\r\\n{|}\\n{/gm;
          const index = stringQueue.search(regex);

          // I KNOW that we can avoid this IF/ELSE statement, but please keep it and preserve the comments "The Dev Remembers"
          if (index === -1) {
            // Index is -1, we didn't find more than 1 JSON in our data
            // Try to get a valid JSON
            const parsed = safeJsonParse(stringQueue);
            if (parsed != null) {
              // In this case or JSON was a valid object, send it to the stream
              emitter.emitData(parsed);
              // Clear the queue ONLY if success
              stringQueue = '';
            }
            // DO NOTHING ELSE
            // If JSON parse failed it could be because or string is incomplete and we are waiting for the next chunk
          } else {
            // We found more than 1 JSON
            // In theory the first JSON will be complete
            // --------- the second JSON might be completed

            // If our string is something like `{\"test\":\"a\"}{\"test\":\"b\"}`
            // Then our index will be 15. It means until this portion `{\"test\":\"a\"`
            // Add +1 to the index to get the correct JSON `{\"test\":\"a\"}`
            const json = stringQueue.slice(0, index + 1);

            // Transform to object
            const parsed = safeJsonParse(json);
            if (parsed != null) {
              // In this case or JSON was a valid object, send it to the stream
              emitter.emitData(parsed);
            }
            // If we had a broken pipe and our JSON is incomplete we will still clear our buffer to avoid infinite loop :D
            // We are using indexOf "{" after our index because our line breaker could be also "}\r\n{"
            stringQueue = stringQueue.slice(stringQueue.indexOf('{', index));
            if (stringQueue.trim().length > 0) {
              // Repeat the process if our queue is not empty
              parseAndSendData();
            }
          }
        };

        // Handler for stream data
        response.data.on('data', (data: Buffer) => {
          // Add data to our queue
          // A single stream might have 0, 1 or any JSON
          // Zero case is if the chunk is too long and it will came in two or more parts
          // We will just concatenate all of them until we can handle them
          stringQueue += data.toString();
          // This function will do the hard work
          parseAndSendData();
        });
      }

      return {
        body,
        headers: response.headers,
        statusCode: response.status,
        raw: {
          request: toJson(params.body, params.responseType),
          response: toJson(response.data, params.responseType)
        },
        url: response.request?._redirectable?._currentUrl ?? url
      };
    } catch (e: any) {
      const error: AxiosError = e;
      const body = error.response?.data as any;

      /* istanbul ignore next */
      if (body?._readableState?.buffer?.head?.data instanceof Buffer) {
        error.message = body._readableState.buffer.head.data.toString();
      }
      return {
        body,
        headers: error.response?.headers ?? {},
        statusCode: error.response?.status ?? 500,
        message: error.message,
        raw: {
          request: toJson(params.body, params.responseType),
          response: toJson(body, params.responseType)
        },
        url: error.response?.request?._redirectable?._currentUrl ?? url
      };
    }
  }
}
