import { MonoClientGenerator } from '..';
import { describeRecording } from '@comparaonline/test-helpers';
import { HttpClient } from 'soap-v2';

const CASSETTES_PATH = 'generator';
const businessUnit = 'CI';

describe('Client generator', () => {
  describeRecording(
    'rest',
    () => {
      it('Should create a rest client', async () => {
        const callback = jest.fn();
        const generator = new MonoClientGenerator({
          businessUnit,
          callback
        });
        const serviceId = 'my-service-that-uses-rest';
        const requestId = 1;
        const client = generator.get(
          {
            type: 'rest',
            baseUrl: 'https://gorest.co.in'
          },
          serviceId,
          requestId
        );
        await client.request({ path: '/public/v1/users', method: 'GET' });
        expect(callback).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), {
          requestId,
          serviceId,
          businessUnit,
          requestDate: expect.any(Date),
          requestTime: expect.any(Number),
          attempt: expect.any(Number),
          isSuccessful: expect.any(Boolean)
        });
      });
    },
    CASSETTES_PATH
  );
  describeRecording(
    'soap',
    () => {
      it('Should create a soap client', async () => {
        const callback = jest.fn();
        const generator = new MonoClientGenerator({
          businessUnit,
          callback
        });
        const serviceId = 'my-service-that-uses-soap';
        const requestId = 2;
        const client = generator.get(
          {
            type: 'soap',
            wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL'
          },
          serviceId,
          requestId
        );
        await client.request({ body: { IntA: 1, IntB: 0 }, method: 'Add' });
        expect(callback).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), {
          requestId,
          serviceId,
          businessUnit,
          requestDate: expect.any(Date),
          requestTime: expect.any(Number),
          attempt: expect.any(Number),
          isSuccessful: expect.any(Boolean)
        });
      });
    },
    CASSETTES_PATH
  );
  describe('soap', () => {
    it('success use overrideEndpoint in request', async () => {
      const callback = jest.fn();
      jest.spyOn(HttpClient.prototype, 'request').mockImplementation((...args) => {
        const result =
          '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><MultiplyResponse xmlns="http://tempuri.org/"><MultiplyResult>20</MultiplyResult></MultiplyResponse></soap:Body></soap:Envelope>';
        const response = {
          data: result,
          status: 200,
          statusText: 'success',
          headers: {},
          config: {}
        };
        if (args[0] !== 'https:newHost') {
          response.status = 500;
        }
        const res = Promise.resolve(response);
        args[2](response.status === 200 ? null : 'Error', res, result);
        return res;
      });
      const generator = new MonoClientGenerator({
        businessUnit,
        callback
      });
      const serviceId = 'my-service-that-uses-soap';
      const requestId = 2;
      const client = generator.get(
        {
          type: 'soap',
          wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
          overwriteEndpoint: 'https:newHost'
        },
        serviceId,
        requestId
      );
      const data = await client.request<any>({
        method: 'Multiply',
        body: {
          intA: 3,
          intB: 6
        }
      });
      expect(callback).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), {
        requestId,
        serviceId,
        businessUnit,
        requestDate: expect.any(Date),
        requestTime: expect.any(Number),
        attempt: expect.any(Number),
        isSuccessful: expect.any(Boolean)
      });
      expect(data.statusCode).toBe(200);
      expect(data.body.MultiplyResult).toBe(20);
      jest.restoreAllMocks();
    });
  });
  describeRecording(
    'serviceId like object',
    () => {
      it('Should create a soap client', async () => {
        const callback = jest.fn();
        const generator = new MonoClientGenerator({
          businessUnit,
          callback
        });
        const serviceId = 'my-service-that-uses-soap';
        const client = generator.get(
          {
            type: 'soap',
            wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL'
          },
          { serviceId, additionalData: { vertical: 'travel', country: 'br', something: 'foo' } }
        );
        await client.request({ body: { IntA: 1, IntB: 0 }, method: 'Add' });
        expect(callback).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), {
          serviceId,
          businessUnit,
          requestDate: expect.any(Date),
          requestTime: expect.any(Number),
          attempt: expect.any(Number),
          isSuccessful: expect.any(Boolean),
          additionalData: expect.any(Object)
        });
      });
    },
    CASSETTES_PATH
  );
});
