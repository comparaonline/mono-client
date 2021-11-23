import axios from 'axios';
import { MonoClient } from '..';
import { ClientBadConfiguration, MissingPathParameter, RequestFail } from '../../exceptions';
import { describeRecording } from '../../test/helpers';

const CASSETTES_PATH = 'client/rest';

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
          const data = await client.request<any>({
            path: '/public/v1/users/{userId}/posts',
            method: 'GET',
            pathParams: {
              userId: 1
            }
          });
          expect(data.statusCode).toBe(200);
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
      'POST',
      () => {
        it('Should create an user', async () => {
          const req = client.request<any>({
            path: '/public/v1/users',
            method: 'POST'
          });
          await expect(req).rejects.toThrowError(RequestFail);
        });
      },
      CASSETTES_PATH
    );
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
            path: '/missing-url'
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
          { body: undefined, headers: {}, message: undefined, statusCode: 500 },
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
        jest.restoreAllMocks();
      });
    });
  });
});
