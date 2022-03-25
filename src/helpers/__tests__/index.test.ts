import { MonoClientRequest } from '../../interfaces';
import { formatResponseErrorMessage } from '..';

describe('Helpers', () => {
  describe('formatResponseErrorMessage method', () => {
    it('Returns formatted error from rest arraybuffer response', () => {
      const type = 'rest';
      const request = {
        path: '/v1/{userId}/posts',
        method: 'get',
        pathParams: {
          userId: 1
        },
        responseType: 'arraybuffer'
      } as MonoClientRequest;
      const error = new Error('Mock awesome error');

      const expectedMessage = formatResponseErrorMessage(type, error, request);
      expect(expectedMessage).toBe('Error downloading array buffer');
    });
    it('Returns standard error from rest response', () => {
      const type = 'rest';
      const request = {
        path: '/v1/{userId}/posts',
        method: 'get',
        pathParams: {
          userId: 1
        }
      } as MonoClientRequest;
      const error = new Error('Mock awesome error');

      const expectedMessage = formatResponseErrorMessage(type, error, request);
      expect(expectedMessage).toBe('Mock awesome error');
    });
  });
});
