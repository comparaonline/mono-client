import { MonoClient } from '..';
import { InvalidMaxRetry } from '../../exceptions';

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
});
