import { MonoClientRequest } from '../../interfaces';
import { formatResponseErrorMessage, safeJsonParse, toNonCircularObject } from '..';

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

  describe('#toNonCircularObject', () => {
    it('convert object to non circular object', () => {
      const obj: { [key: string]: any } = {
        prop1: 'string',
        prop2: 123,
        prop3: undefined,
        prop4: null,
        prop5: { child1: '' }
      };
      obj.prop5.child2 = obj;
      obj.prop6 = obj;

      const nonCircularObj = toNonCircularObject(obj);

      expect(nonCircularObj).toStrictEqual({
        prop1: 'string',
        prop2: 123,
        prop4: null,
        prop5: { child1: '' }
      });
    });
  });

  describe('safeJsonParse', () => {
    it('Should return an object', () => {
      const json = '{ "test": "a" }';
      expect(safeJsonParse(json)).toHaveProperty('test', 'a');
    });

    it('Should return null', () => {
      const json = '{ "test: a';
      expect(safeJsonParse(json)).toBe(null);
    });
  });
});
