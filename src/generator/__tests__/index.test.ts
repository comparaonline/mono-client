import { MonoClientGenerator } from '..';
import { describeRecording } from '@comparaonline/test-helpers';

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
});
