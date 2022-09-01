import axios from 'axios';
import { RequestFail } from '../../exceptions';
import { MonoClient } from '..';

const successful200Response = Promise.resolve({
  data: {
    message: 'ok'
  },
  headers: {},
  status: 200
});

const unsuccessful200Response = Promise.resolve({
  data: {
    message: 'oops'
  },
  headers: {},
  status: 200
});

const unsuccessful400Response = Promise.resolve({
  data: {
    message: 'bad-request'
  },
  headers: {},
  status: 400
});

describe('Is successful callback functionality', () => {
  describe('Execute it if success', () => {
    it('Go true', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return successful200Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        isSuccessfulCallback(response): boolean {
          return response.body.message === 'ok';
        }
      });
      const data = await client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      expect(data).toBeDefined();
      jest.restoreAllMocks();
    });

    it('Go false', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful200Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        isSuccessfulCallback(response): boolean {
          return response.body.message === 'ok';
        }
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      await expect(promise).rejects.toThrow(RequestFail);
      jest.restoreAllMocks();
    });
  });
  describe('Execute it even if fail', () => {
    it('Client config', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        isSuccessfulCallback(response): boolean | string {
          return response.body.message !== 'ok' ? response.body.message : true;
        },
        avoidIsSuccessfulCallback: false
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      await expect(promise).rejects.toThrowError('Request Fail - 400 - bad-request');
      jest.restoreAllMocks();
    });

    it('Request', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        isSuccessfulCallback(response): boolean | Error {
          return response.body.message !== 'ok' ? new Error(response.body.message) : true;
        },
        avoidIsSuccessfulCallback: true
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        avoidIsSuccessfulCallback: false
      });

      await expect(promise).rejects.toThrowError('Request Fail - 400 - bad-request');
      jest.restoreAllMocks();
    });
  });

  describe('Not execute if fail', () => {
    it('Default config', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const isSuccessfulCallback = jest.fn();
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        isSuccessfulCallback
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      expect(isSuccessfulCallback).not.toHaveBeenCalled();
      await expect(promise).rejects.toThrowError('Request Fail - 400 - {"message":"bad-request"}');
      jest.restoreAllMocks();
    });

    it('Client config', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const isSuccessfulCallback = jest.fn();
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        isSuccessfulCallback,
        avoidIsSuccessfulCallback: true
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      expect(isSuccessfulCallback).not.toHaveBeenCalled();
      await expect(promise).rejects.toThrowError('Request Fail - 400 - {"message":"bad-request"}');
      jest.restoreAllMocks();
    });

    it('Request config', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const isSuccessfulCallback = jest.fn();
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        isSuccessfulCallback,
        avoidIsSuccessfulCallback: false
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        avoidIsSuccessfulCallback: true
      });

      expect(isSuccessfulCallback).not.toHaveBeenCalled();
      await expect(promise).rejects.toThrowError('Request Fail - 400 - {"message":"bad-request"}');
      jest.restoreAllMocks();
    });
  });

  describe('Default behavior', () => {
    it('Empty config', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com'
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      await expect(promise).rejects.toThrowError('Request Fail - 400 - {"message":"bad-request"}');
      jest.restoreAllMocks();
    });

    it('Empty callback', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        avoidIsSuccessfulCallback: false
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      await expect(promise).rejects.toThrowError('Request Fail - 400 - {"message":"bad-request"}');
      jest.restoreAllMocks();
    });

    it('Error handler - config', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        avoidIsSuccessfulCallback: true,
        errorHandler(response): any {
          return response.body.message;
        }
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      await expect(promise).rejects.toThrowError('Request Fail - 400 - bad-request');
      jest.restoreAllMocks();
    });

    it('Error handler - config', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        avoidIsSuccessfulCallback: true,
        errorHandler(): any {
          return 'wrong message';
        }
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        errorHandler(response): any {
          return response.body.message;
        }
      });

      await expect(promise).rejects.toThrowError('Request Fail - 400 - bad-request');
      jest.restoreAllMocks();
    });

    it('Error handler - catch', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return unsuccessful400Response;
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        avoidIsSuccessfulCallback: true,
        errorHandler(response): any {
          return response.body.message.something.anything;
        }
      });
      const promise = client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      await expect(promise).rejects.toThrowError(
        "Request Fail - 400 - Cannot read properties of undefined (reading 'anything')"
      );
      jest.restoreAllMocks();
    });
  });
});
