import axios from 'axios';
import { MonoClient } from '..';

const CLIENT_DATA = {
  client: 'aaa'
};

const RESPONSE_DATA = {
  clientData: JSON.stringify(CLIENT_DATA)
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
});
