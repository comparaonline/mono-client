# mono-client

## Table of Contents

  - [Features](#features)
  - [Installing](#installing)
  - [Example](#example)
    - [SOAP](#soap)
    - [REST](#rest)
    - [Client advaced configuration](#client-advaced-configuration)
  - [Mono-client API](#mono-client-api)
  - [Mono-client Generator API](#mono-client-generator-api)

## Features

- Wrapper for SOAP and REST requests
- Easy retry and successful response validation
- Callback interceptor
- Metrics and starts date always available
- Reuse configuration for business units and services
- TypeScript Support
- body parser 

## Installing

Using npm:

```bash
$ npm i @comparaonline/mono-client
```

Using yarn:

```bash
$ yarn add @comparaonline/mono-client
```

## Example

### SOAP

```ts
import { MonoClient } from '@comparaonline/mono-client';

async function sum() {
  const soapClient = new MonoClient({
    type: 'soap',
    wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL'
  });

  const response = await soapClient.request({
    method: 'Add',
    body: {
     intA: 1,
     intB: 2
    }
  });

  console.log(response.body);
  console.log(response.headers);
  console.log(response.statusCode);
}
```

### REST

```ts
import { MonoClient } from '@comparaonline/mono-client';

async function getUser() {
  const restClient = new MonoClient({
    type: 'rest',
    baseUrl: 'https://gorest.co.in'
  });

  const response = await restClient.request({
    path: '/public/v1/users/{userId}',
    pathParams: {
      userId: 2
    }
  });

  console.log(response.body);
  console.log(response.headers);
  console.log(response.statusCode);
}
```

### REST Stream

If you are receiving data as stream and it content is a group of JSONs then you can use `streamRequest` with responseType `json-stream`. This will return a simple event emitter with each object

```ts
import { MonoClient } from '@comparaonline/mono-client';

async function stream() {
  const restClient = new MonoClient({
    type: 'rest',
    baseUrl: 'https://gorest.co.in'
  });

  const data = await restClient.streamRequest({
    path: '/public/v1/users/{userId}',
    method: 'GET',
    responseType: 'json-stream'
  });

  data.body.on('data', (json) => {
    // JSON as object
  });

  data.body.on('end', () => {
    // End of stream (error included)
  });
}
```

### Client advaced configuration

```ts
import { MonoClient, StatusCode, MonoClientGenerator } from '@comparaonline/mono-client';
import { randomUUID } from 'crypto';

async function testSoap() {
  const soapClient = new MonoClient({
    type: 'soap',
    wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
    callback(request, response, info) {
      // Usefull for metrics
      console.log(request);
      console.log(response);
      console.log(info);
    },
    extra: {
      businessUnit: 'my-business-unit',
      requestId: randomUUID(),
      serviceId: 'my-service-id'
    },
    ssl: {
      // this overwrites default HttpsAgent
      type: 'ssl-security', // ssl-pfx-security | ssl-reject
      cert: Buffer.from(''),
      key: '/path',
      ca: '/path', // optional
      rejectUnauthorized: false // optional
    },
    isSuccessfulCallback(response) {
      // default validation is statusCode 200 or 201
      return response.body.Error == null; // custom validation inside client
    },
    retry: {
      maxRetry: 2,
      on: [StatusCode.S4XX], // Retry if error is 4XX
      notOn: [StatusCode.E400], // not retry if error is 400
      shouldRetryCallback(request, response) {
        // This will overwrite retry on and notOn
        return response.body.Error === 'server timeout';
      }
    },
    bodyParser<T>(body: any): T {
      //Allows you to parse any property inside the response body, and re-assign it
      return JSON.parse(body.clientData);
    }
  });
  const response = await soapClient.request({
    method: 'Add',
    body: {
      intA: 1,
      intB: 2
    },
    headers: {
      'my-header': 'test'
    },
    isSuccessfulCallback(response) {
      // overwrite client custom validation and 200/201 validation
      return response.body.Error == null && response.body.Success === 'yes'; // custom validation per request
    },
    overwriteWsdl: 'http://www.dneonline.com/calculator.asmx?WSDL', // Use a specific enpoint for a request but preserving client configuration
    requestTimeout: 3000, // default 120000 ms
    shouldRetryCallback(request, response) {
      // This will overwrite client shouldRetryCallback, retry on and retry notOn. maxAttempt must by set on client
      return (
        response.body.Error === 'server timeout' ||
        response.body.Error === 'server max attempts per minute'
      );
    }
  });
}

async function restTest() {
  const restClient = new MonoClient({
    type: 'rest',
    baseUrl: 'https://gorest.co.in',
    callback(request, response, info) {
      console.log(request);
      console.log(response);
      console.log(info);
    },
    extra: {
      businessUnit: 'my-business-unit',
      requestId: randomUUID(),
      serviceId: 'my-service-id'
    },
    ssl: {
      type: 'ssl-security', // ssl-pfx-security | ssl-reject
      cert: Buffer.from(''),
      key: '/path',
      ca: '/path', // optional
      rejectUnauthorized: false // optional
    },
    isSuccessfulCallback(response) {
      // default validation is statusCode 200 or 201
      return response.body.Error == null; // custom validation inside client
    },
    retry: {
      maxRetry: 2,
      on: [StatusCode.S4XX], // Retry if error is 4XX
      notOn: [StatusCode.E400], // not retry if error is 400
      shouldRetryCallback(request, response) {
        // This will overwrite retry on and notOn
        return response.body.Error === 'server timeout';
      },
      delayInSeconds: 5 // time in seconds between retries
    },
    bodyParser<T>(body: any): T {
      //Allows you to parse any property inside the response body, and re-assign it
      return JSON.parse(body.clientData);
    }
  });

  const response = await restClient.request({
    method: 'get', // Default
    path: '/public/v1/users/{userId}',
    pathParams: {
      userId: 2
    },
    body: {
      someParam: 1
    },
    headers: {
      'test-header': 'test'
    },
    queryParams: {
      page: 1,
      limit: 40
    },
    isSuccessfulCallback(response) {
      // overwrite client custom validation and 200/201 validation
      return response.body.Error == null && response.body.Success === 'yes'; // custom validation per request
    },
    overwriteBaseUrl: 'https://gorest.co.in', // Use a specific baseUrl for a request but preserving client configuration
    requestTimeout: 3000, // default 120000 ms
    shouldRetryCallback(request, response) {
      // This will overwrite client shouldRetryCallback, retry on and retry notOn. maxAttempt must by set on client
      return (
        response.body.Error === 'server timeout' ||
        response.body.Error === 'server max attempts per minute'
      );
    }
  });
}


async function generatorTest() {
  const generator = new MonoClientGenerator({
    businessUnit: 'my-business-unit', // Every client generated with this generator will have the same businessUnit
    callback(request, response, info) {
      // Every client generated with this generator will have the same callback
      console.log(request);
      console.log(response);
      console.log(info);
    },
    bodyParser<T>(body: any): T {
      //Allows you to parse any property inside the response body, and re-assign it
      return JSON.parse(body.clientData);
  });

  const restClient = generator.get({
    type: 'rest',
    baseUrl: 'https://gorest.co.in'
    // you can setup all the params for this client as any other REST client except for businessUnit and callback
  }, 'my-service-id-1', 'my-request-id-1');

  const soapClient = generator.get({
    type: 'soap'
    // you can setup all the params for this client as any other SOAP client except for businessUnit and callback
  }, 'my-service-id-2', 'my-request-id-2');
}

```

## Debug 

```bash
MONO_CLIENT_DEBUG=true
```

## Mono Client API

TODO

## Mono Client Generator API

TODO
