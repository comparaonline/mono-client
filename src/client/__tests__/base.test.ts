import { MonoClient } from '..';
import { InvalidMaxRetry, RequestFail } from '../../exceptions';
import { StatusCode } from '../../interfaces';
import { RestClient } from '../../rest';
import { describeRecording } from '@comparaonline/test-helpers';

const CASSETTES_PATH = 'client/base';

describe('Mono client', () => {
  describe('base config', () => {
    it('Should throw a invalid max retry exception', async () => {
      const client = new MonoClient({
        type: 'rest',
        retry: {
          maxRetry: -1
        },
        baseUrl: 'https://gorest.co.in'
      });
      const req = client.request({
        path: '/api'
      });
      await expect(req).rejects.toThrowError(InvalidMaxRetry);
    });
  });
  describeRecording(
    'Should retry logic',
    () => {
      it('should retry by max retry', async () => {
        const callback = jest.fn();
        const client = new MonoClient({
          type: 'rest',
          retry: {
            maxRetry: 2
          },
          baseUrl: 'https://gorest.co.in',
          callback
        });
        const req = client.request({
          path: '/api/not-existent'
        });
        await expect(req).rejects.toThrowError(RequestFail);
        expect(callback).toHaveBeenCalledTimes(3);
      });
      it('should retry by match 400', async () => {
        const callback = jest.fn();
        const client = new MonoClient({
          type: 'rest',
          retry: {
            maxRetry: 1,
            on: [StatusCode.S4XX],
            notOn: [StatusCode.E400]
          },
          baseUrl: 'https://gorest.co.in',
          extra: {
            requestId: 1,
            serviceId: 'co',
            businessUnit: 'ci'
          },
          callback
        });
        const req = client.request({
          path: '/api/not-existent'
        });
        await expect(req).rejects.toThrowError(RequestFail);
        expect(callback).toHaveBeenCalledTimes(2);
      });
      it("shouldn't retry by match 404", async () => {
        const callback = jest.fn();
        const client = new MonoClient({
          type: 'rest',
          retry: {
            maxRetry: 10,
            on: [StatusCode.S4XX],
            notOn: [StatusCode.E404]
          },
          baseUrl: 'https://gorest.co.in',
          extra: {
            requestId: 1,
            serviceId: 'co',
            businessUnit: 'ci'
          },
          callback
        });
        const req = client.request({
          path: '/api/not-existent'
        });
        await expect(req).rejects.toThrowError(RequestFail);
        expect(callback).toHaveBeenCalledTimes(1);
      });
      it("shouldn't retry by match 5XX", async () => {
        const callback = jest.fn();
        jest.spyOn(RestClient.prototype, 'request').mockImplementation(() => {
          return new Promise((resolve) => {
            resolve({
              body: '',
              headers: {},
              statusCode: 500,
              raw: {
                request: '',
                response: ''
              }
            });
          });
        });
        const client = new MonoClient({
          type: 'rest',
          retry: {
            maxRetry: 10,
            notOn: [StatusCode.S5XX]
          },
          baseUrl: 'https://gorest.co.in',
          callback
        });
        const req = client.request({
          path: '/api/mocked-with-jest'
        });
        await expect(req).rejects.toThrowError(RequestFail);
        expect(callback).toHaveBeenCalledTimes(1);
        jest.restoreAllMocks();
      });
      let firstRetryCallbackCounter = 0;
      it('should retry by retry callback', async () => {
        const callback = jest.fn();
        jest.spyOn(RestClient.prototype, 'request').mockImplementation(() => {
          firstRetryCallbackCounter++;
          return new Promise((resolve) => {
            resolve({
              body: {
                counter: firstRetryCallbackCounter
              },
              headers: {},
              statusCode: 500,
              raw: {
                request: '',
                response: ''
              }
            });
          });
        });
        const client = new MonoClient({
          type: 'rest',
          retry: {
            maxRetry: 10,
            shouldRetryCallback(request, response): boolean {
              return response.body.counter < 3;
            }
          },
          baseUrl: 'https://gorest.co.in',
          callback
        });
        const req = client.request({
          path: '/api/mocked-with-jest'
        });
        await expect(req).rejects.toThrowError(RequestFail);
        expect(callback).toHaveBeenCalledTimes(3);
        jest.restoreAllMocks();
      });
      let secondRetryCallbackCounter = 0;
      it('should retry by request retry callback', async () => {
        const callback = jest.fn();
        jest.spyOn(RestClient.prototype, 'request').mockImplementation(() => {
          secondRetryCallbackCounter++;
          return new Promise((resolve) => {
            resolve({
              body: {
                counter: secondRetryCallbackCounter
              },
              headers: {},
              statusCode: 500,
              raw: {
                request: '',
                response: ''
              }
            });
          });
        });
        const client = new MonoClient({
          type: 'rest',
          retry: {
            maxRetry: 10,
            shouldRetryCallback(request, response): boolean {
              return response.body.counter < 3;
            }
          },
          baseUrl: 'https://gorest.co.in',
          callback
        });
        const req = client.request({
          path: '/api/mocked-with-jest',
          shouldRetryCallback(request, response): boolean {
            return response.body.counter < 4;
          }
        });
        await expect(req).rejects.toThrowError(RequestFail);
        expect(callback).toHaveBeenCalledTimes(4);
        jest.restoreAllMocks();
      });
      it("shouldn't retry by successful callback", async () => {
        const callback = jest.fn();
        jest.spyOn(RestClient.prototype, 'request').mockImplementation(() => {
          return new Promise((resolve) => {
            resolve({
              body: 'Happy',
              headers: {},
              statusCode: 500,
              raw: {
                request: '',
                response: ''
              }
            });
          });
        });
        const client = new MonoClient({
          type: 'rest',
          retry: {
            maxRetry: 10
          },
          isSuccessfulCallback(): boolean {
            return true;
          },
          baseUrl: 'https://gorest.co.in',
          callback
        });
        const response = await client.request({
          path: '/api/mocked-with-jest'
        });
        expect(response.body).toBe('Happy');
        expect(callback).toHaveBeenCalledTimes(1);
        jest.restoreAllMocks();
      });
      it("shouldn't retry by request successful callback", async () => {
        const callback = jest.fn();
        jest.spyOn(RestClient.prototype, 'request').mockImplementation(() => {
          return new Promise((resolve) => {
            resolve({
              body: 'Happy',
              headers: {},
              statusCode: 500,
              raw: {
                request: '',
                response: ''
              }
            });
          });
        });
        const client = new MonoClient({
          type: 'rest',
          retry: {
            maxRetry: 10
          },
          isSuccessfulCallback(): boolean {
            return false;
          },
          baseUrl: 'https://gorest.co.in',
          callback
        });
        const response = await client.request({
          path: '/api/mocked-with-jest',
          isSuccessfulCallback(): boolean {
            return true;
          }
        });
        expect(response.body).toBe('Happy');
        expect(callback).toHaveBeenCalledTimes(1);
        jest.restoreAllMocks();
      });
    },
    CASSETTES_PATH
  );
});
