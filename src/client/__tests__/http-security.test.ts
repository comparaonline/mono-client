import { describeRecording } from '@comparaonline/test-helpers';
import { HttpClient } from 'soap-v2';
import { MonoClient } from '..';
import axios from 'axios';

const CASSETTES_PATH = 'client/http-security';

function lastItem(items: any[]): any {
  return items[items.length - 1];
}

const token =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NjM4ODAzMzUsImV4cCI6MTY5NTQxNjMzNSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.cKbCo76vnHY5SuJIg81q7rB541IQW78oBqRqlGqyQkM';

describe('Http security', () => {
  describe('Soap test', () => {
    describeRecording(
      'Soap test requests',
      () => {
        const soapClient = new MonoClient({
          type: 'soap',
          wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL'
        });
        it('Should add basic security http header', async () => {
          const soapSpy = jest.spyOn(HttpClient.prototype, 'request');
          soapSpy.mockClear();
          await soapClient.request<any>({
            method: 'Multiply',
            body: {
              intA: 3,
              intB: 6
            },
            security: {
              basic: {
                username: 'root',
                password: 'root'
              }
            }
          });

          const authorizationHeader: string = lastItem(lastItem(soapSpy.mock.calls))
            .lastRequestHeaders.Authorization;
          expect(authorizationHeader).toBe('Basic cm9vdDpyb290');
          jest.clearAllMocks();
        });

        it('Should add bearer security http header', async () => {
          const soapSpy = jest.spyOn(HttpClient.prototype, 'request');
          soapSpy.mockClear();
          await soapClient.request<any>({
            method: 'Multiply',
            body: {
              intA: 3,
              intB: 6
            },
            security: {
              bearer: token
            }
          });
          const authorizationHeader: string = lastItem(lastItem(soapSpy.mock.calls))
            .lastRequestHeaders.Authorization;
          expect(authorizationHeader).toBe(`Bearer ${token}`);
          jest.clearAllMocks();
        });
      },
      CASSETTES_PATH
    );
    describeRecording(
      'Soap test client',
      () => {
        it('Should add basic security http header', async () => {
          const soapClient = new MonoClient({
            type: 'soap',
            wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
            security: {
              basic: {
                username: 'root',
                password: 'root'
              }
            }
          });
          const soapSpy = jest.spyOn(HttpClient.prototype, 'request');
          soapSpy.mockClear();
          await soapClient.request<any>({
            method: 'Multiply',
            body: {
              intA: 3,
              intB: 6
            }
          });

          const authorizationHeader: string = lastItem(lastItem(soapSpy.mock.calls))
            .lastRequestHeaders.Authorization;
          expect(authorizationHeader).toBe('Basic cm9vdDpyb290');
          jest.clearAllMocks();
        });

        it('Should add bearer security http header', async () => {
          const soapClient = new MonoClient({
            type: 'soap',
            wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
            security: {
              bearer: token
            }
          });
          const soapSpy = jest.spyOn(HttpClient.prototype, 'request');
          soapSpy.mockClear();

          await soapClient.request<any>({
            method: 'Multiply',
            body: {
              intA: 3,
              intB: 6
            }
          });
          const authorizationHeader: string = lastItem(lastItem(soapSpy.mock.calls))
            .lastRequestHeaders.Authorization;
          expect(authorizationHeader).toBe(`Bearer ${token}`);
          jest.clearAllMocks();
        });
      },
      CASSETTES_PATH
    );

    describeRecording(
      'Soap test overwrite',
      () => {
        it('Should add bearer security http header', async () => {
          const soapClient = new MonoClient({
            type: 'soap',
            wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
            security: {
              basic: {
                username: 'root',
                password: 'root'
              }
            }
          });
          const soapSpy = jest.spyOn(HttpClient.prototype, 'request');
          soapSpy.mockClear();
          await soapClient.request<any>({
            method: 'Multiply',
            body: {
              intA: 3,
              intB: 6
            },
            security: {
              bearer: token
            }
          });

          const authorizationHeader: string = lastItem(lastItem(soapSpy.mock.calls))
            .lastRequestHeaders.Authorization;
          expect(authorizationHeader).toBe(`Bearer ${token}`);
          jest.clearAllMocks();
        });
      },
      CASSETTES_PATH
    );
  });

  describe('Rest test', () => {
    describeRecording(
      'Rest test requests',
      () => {
        const restClient = new MonoClient({
          type: 'rest',
          baseUrl: 'https://rickandmortyapi.com'
        });
        it('Should add basic security http header', async () => {
          const restSpy = jest.spyOn(axios, 'request');
          restSpy.mockClear();
          await restClient.request<any>({
            path: '/api/location/1',
            security: {
              basic: {
                username: 'root',
                password: 'root'
              }
            }
          });

          const authorizationHeader: string = lastItem(lastItem(restSpy.mock.calls)).headers
            .Authorization;
          expect(authorizationHeader).toBe('Basic cm9vdDpyb290');
          jest.clearAllMocks();
        });

        it('Should add bearer security http header', async () => {
          const restSpy = jest.spyOn(axios, 'request');
          restSpy.mockClear();
          await restClient.request<any>({
            path: '/api/location/1',
            security: {
              bearer: token
            }
          });

          const authorizationHeader: string = lastItem(lastItem(restSpy.mock.calls)).headers
            .Authorization;
          expect(authorizationHeader).toBe(`Bearer ${token}`);
          jest.clearAllMocks();
        });
      },
      CASSETTES_PATH
    );
    describeRecording(
      'Rest test client',
      () => {
        it('Should add basic security http header', async () => {
          const restClient = new MonoClient({
            type: 'rest',
            baseUrl: 'https://rickandmortyapi.com',
            security: {
              basic: {
                username: 'root',
                password: 'root'
              }
            }
          });
          const restSpy = jest.spyOn(axios, 'request');
          restSpy.mockClear();
          await restClient.request<any>({
            path: '/api/location/1'
          });

          const authorizationHeader: string = lastItem(lastItem(restSpy.mock.calls)).headers
            .Authorization;
          expect(authorizationHeader).toBe('Basic cm9vdDpyb290');
          jest.clearAllMocks();
        });

        it('Should add bearer security http header', async () => {
          const restClient = new MonoClient({
            type: 'rest',
            baseUrl: 'https://rickandmortyapi.com',
            security: {
              bearer: token
            }
          });
          const restSpy = jest.spyOn(axios, 'request');
          restSpy.mockClear();

          await restClient.request<any>({
            path: '/api/location/1'
          });
          const authorizationHeader: string = lastItem(lastItem(restSpy.mock.calls)).headers
            .Authorization;
          expect(authorizationHeader).toBe(`Bearer ${token}`);
          jest.clearAllMocks();
        });
      },
      CASSETTES_PATH
    );

    describeRecording(
      'Rest test overwrite',
      () => {
        it('Should add bearer security http header', async () => {
          const restClient = new MonoClient({
            type: 'rest',
            baseUrl: 'https://rickandmortyapi.com',
            security: {
              basic: {
                username: 'root',
                password: 'root'
              }
            }
          });
          const restSpy = jest.spyOn(axios, 'request');
          restSpy.mockClear();
          await restClient.request<any>({
            path: '/api/location/1',
            security: {
              bearer: token
            }
          });

          const authorizationHeader: string = lastItem(lastItem(restSpy.mock.calls)).headers
            .Authorization;
          expect(authorizationHeader).toBe(`Bearer ${token}`);
          jest.clearAllMocks();
        });
      },
      CASSETTES_PATH
    );
  });
});
