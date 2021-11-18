import { MonoClient } from '..';
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
          const data = await client.request({
            path: '/public/v1/users',
            method: 'GET'
          });
          expect(data.statusCode).toBe(200);
        });
      },
      CASSETTES_PATH
    );
    describeRecording(
      'GET',
      () => {
        it('Should get exactly 2 users', async () => {
          const data = await client.request<any>({
            path: '/public/v1/users',
            method: 'GET',
            queryParams: {
              limit: 2
            }
          });
          expect(data.statusCode).toBe(200);
          expect(data.body.meta.pagination.limit).toBe(2);
        });
      },
      CASSETTES_PATH
    );
  });
});
