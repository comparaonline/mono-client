import axios from 'axios';
import { MonoClient } from '..';
import { ClientBadConfiguration, MissingPathParameter, RequestFail } from '../../exceptions';
import { describeRecording } from '@comparaonline/test-helpers';

const CASSETTES_PATH = 'client/rest';
const RESPONSE_DATA = 'I am text';

describe('Rest client', () => {
  describe('basic config', () => {
    const client = new MonoClient({
      type: 'rest',
      baseUrl: 'https://gorest.co.in'
    });
    describeRecording(
      'GET',
      () => {
        it('Should get a list of users', async () => {
          const data = await client.request<any>({
            path: '/public/v1/users',
            method: 'GET'
          });
          expect(data.statusCode).toBe(200);
        });
        it('Should get exactly 2 users', async () => {
          const PAGE = 2;
          const data = await client.request<any>({
            path: '/public/v1/users',
            method: 'GET',
            queryParams: {
              page: PAGE
            }
          });
          expect(data.statusCode).toBe(200);
          expect(data.body.meta.pagination.page).toBe(PAGE);
        });
        it('Should complete path params', async () => {
          const callback = jest.fn();
          const data = await client.request<any>({
            path: '/public/v1/users/{userId}/posts',
            method: 'GET',
            pathParams: {
              userId: 1
            },
            callback
          });
          expect(data.statusCode).toBe(200);
          expect(callback).toHaveBeenCalled();
        });
        it('Should use a different API', async () => {
          const LOCATION_ID = 3;
          const data = await client.request<any>({
            overwriteBaseUrl: 'https://rickandmortyapi.com',
            path: '/api/location/{locationId}',
            method: 'GET',
            pathParams: {
              locationId: LOCATION_ID
            }
          });
          expect(data.statusCode).toBe(200);
          expect(data.body.id).toBe(LOCATION_ID);
          expect(Array.isArray(data.body.residents)).toBe(true);
        });
      },
      CASSETTES_PATH
    );
    describeRecording(
      'GET - With reject unauthorized',
      () => {
        it('Should get a list of users', async () => {
          const client = new MonoClient({
            type: 'rest',
            baseUrl: 'https://gorest.co.in',
            ssl: {
              type: 'ssl-reject',
              rejectUnauthorized: false
            }
          });
          const data = await client.request<any>({
            path: '/public/v1/users',
            method: 'GET',
            requestTimeout: 2000
          });
          expect(data.statusCode).toBe(200);
        });
      },
      CASSETTES_PATH
    );
    describe('POST', () => {
      it('Should create an user', async () => {
        jest.spyOn(axios, 'request').mockImplementation(() => {
          return new Promise((resolve) => {
            resolve({
              data: RESPONSE_DATA,
              headers: {},
              status: 201
            });
          });
        });
        const data = await client.request<any>({
          path: '/public/v1/users',
          method: 'POST',
          body: {
            data: 'empty'
          }
        });
        expect(data.body).toBe(RESPONSE_DATA);
        jest.restoreAllMocks();
      });

      it("Shouldn't create an user", async () => {
        jest.spyOn(axios, 'request').mockImplementation(() => {
          return new Promise((resolve, reject) => {
            reject({
              response: {
                data: {},
                headers: {},
                status: 403
              }
            });
          });
        });
        const req = client.request<any>({
          path: '/public/v1/users',
          method: 'POST',
          body: {
            data: 'empty'
          },
          isSuccessfulCallback() {
            return new Error('Error');
          }
        });
        await expect(req).rejects.toThrowError(RequestFail);
        jest.restoreAllMocks();
      });
    });
    describeRecording(
      'Errors',
      () => {
        it('Should throw a missing param exception', async () => {
          const req = client.request({
            path: '/{userId}'
          });
          await expect(req).rejects.toThrowError(MissingPathParameter);
        });
        it('Should throw a client bad configuration exception', async () => {
          const client = new MonoClient({
            type: 'rest'
          });
          const req = client.request({
            path: '/api'
          });
          await expect(req).rejects.toThrowError(ClientBadConfiguration);
        });
        it('Should throw a request fail exception (404)', async () => {
          const req = client.request({
            path: '/missing-url',
            isSuccessfulCallback() {
              return 'Error';
            }
          });
          await expect(req).rejects.toThrowError(RequestFail);
        });
      },
      CASSETTES_PATH
    );
    describe('Catch not axios errors', () => {
      it('should return error with response params', async () => {
        const callback = jest.fn();
        jest.spyOn(axios, 'request').mockImplementation(() => {
          return new Promise((resolve, reject) => {
            reject('Axios');
          });
        });
        const client = new MonoClient({
          type: 'rest',
          baseUrl: 'https://gorest.co.in',
          callback
        });
        const req = client.request({
          path: '/api/mocked-with-jest'
        });
        await expect(req).rejects.toThrowError(RequestFail);
        expect(callback).toHaveBeenCalledWith(
          { path: '/api/mocked-with-jest' },
          {
            body: undefined,
            headers: {},
            message: undefined,
            statusCode: 500,
            raw: {
              request: '',
              response: ''
            }
          },
          {
            attempt: 1,
            businessUnit: undefined,
            isSuccessful: false,
            requestDate: expect.any(Date),
            requestId: undefined,
            requestTime: expect.any(Number),
            serviceId: undefined
          }
        );
        const reqWithBody = client.request({
          path: '/api/mocked-with-jest',
          body: {
            data: 'empty'
          }
        });
        await expect(reqWithBody).rejects.toThrowError(RequestFail);
        await expect(reqWithBody).rejects.toThrowError('Request Fail - 500 - unknown error');
        jest.restoreAllMocks();
      });
    });
  });
});
