import axios from 'axios';
import { BodyParserFail, RequestFail } from '../../exceptions';
import { MonoClient } from '..';

const CLIENT_DATA = {
  client: 'aaa'
};

const RESPONSE_DATA = {
  clientData: JSON.stringify(CLIENT_DATA)
};

const RESPONSE_NOT_PARSABLE_DATA = {
  clientData: '["foo", "bar\\"]'
};

describe('Body parser functionality', () => {
  describe('Send body parser to client', () => {
    it('Should parse data', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            data: RESPONSE_DATA,
            headers: {},
            status: 200
          });
        });
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        bodyParser<T>(body: any): T {
          return JSON.parse(body.clientData);
        }
      });
      const data = await client.request<any>({
        path: '/public/v1/users',
        method: 'POST'
      });

      expect(data.body).toStrictEqual(CLIENT_DATA);
      jest.restoreAllMocks();
    });
  });
  describe('Send body parser to request', () => {
    it('Should parse data', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            data: RESPONSE_DATA,
            headers: {},
            status: 200
          });
        });
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com'
      });
      const data = await client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        bodyParser<T>(body: any): T {
          return JSON.parse(body.clientData);
        }
      });

      expect(data.body).toStrictEqual(CLIENT_DATA);
      jest.restoreAllMocks();
    });
  });

  describe('Send body parser to request', () => {
    it('return error', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            data: RESPONSE_NOT_PARSABLE_DATA,
            headers: {},
            status: 200
          });
        });
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com'
      });
      const data = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        bodyParser<T>(body: any): T {
          return JSON.parse(body.clientData);
        }
      });
      await expect(data).rejects.toThrowError(BodyParserFail);
      jest.restoreAllMocks();
    });
  });

  describe('Avoid body parser execution', () => {
    it('default config', async () => {
      const bodyParser = jest.fn();

      jest.spyOn(axios, 'request').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            data: RESPONSE_NOT_PARSABLE_DATA,
            headers: {},
            status: 400
          });
        });
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com'
      });

      const data = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        bodyParser
      });
      expect(bodyParser).not.toHaveBeenCalled();
      await expect(data).rejects.toThrowError(RequestFail);
      jest.restoreAllMocks();
    });

    it('client config', async () => {
      const bodyParser = jest.fn();

      jest.spyOn(axios, 'request').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            data: RESPONSE_NOT_PARSABLE_DATA,
            headers: {},
            status: 400
          });
        });
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        avoidBodyParserExecution: true
      });

      const data = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        bodyParser
      });
      expect(bodyParser).not.toHaveBeenCalled();
      await expect(data).rejects.toThrowError(RequestFail);
      jest.restoreAllMocks();
    });

    it('request', async () => {
      const bodyParser = jest.fn();

      jest.spyOn(axios, 'request').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            data: RESPONSE_NOT_PARSABLE_DATA,
            headers: {},
            status: 400
          });
        });
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        avoidBodyParserExecution: false
      });

      const data = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        bodyParser,
        avoidBodyParserExecution: true
      });
      expect(bodyParser).not.toHaveBeenCalled();
      await expect(data).rejects.toThrowError(RequestFail);
      jest.restoreAllMocks();
    });
  });

  describe('Allow body parser execution', () => {
    it('client config', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            data: RESPONSE_NOT_PARSABLE_DATA,
            headers: {},
            status: 400
          });
        });
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        avoidBodyParserExecution: false
      });

      const data = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        bodyParser<T>(body: any): T {
          return JSON.parse(body.clientData);
        }
      });
      await expect(data).rejects.toThrowError(BodyParserFail);
      jest.restoreAllMocks();
    });

    it('request', async () => {
      jest.spyOn(axios, 'request').mockImplementation(() => {
        return new Promise((resolve) => {
          resolve({
            data: RESPONSE_NOT_PARSABLE_DATA,
            headers: {},
            status: 400
          });
        });
      });
      const client = new MonoClient({
        type: 'rest',
        baseUrl: 'www.test.com',
        avoidBodyParserExecution: true
      });

      const data = client.request<any>({
        path: '/public/v1/users',
        method: 'POST',
        bodyParser<T>(body: any): T {
          return JSON.parse(body.clientData);
        },
        avoidBodyParserExecution: false
      });
      await expect(data).rejects.toThrowError(BodyParserFail);
      jest.restoreAllMocks();
    });
  });
});
