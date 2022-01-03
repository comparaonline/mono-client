import { MonoClient } from '..';
import {
  ClientBadConfiguration,
  MissingMandatoryParamenter,
  MissingSoapMethod,
  RequestFail
} from '../../exceptions';
import { describeRecording } from '@comparaonline/test-helpers';
import { join } from 'path';

const CASSETTES_PATH = 'client/soap';
const WSDL_PATH = join(__dirname, '../../test/factories/soap/wsdl.xml');

describe('Soap client', () => {
  describe('basic config', () => {
    const client = new MonoClient({
      type: 'soap',
      wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL'
    });
    describeRecording(
      'Add',
      () => {
        it('Should sum two numbers', async () => {
          const data = await client.request<any>({
            method: 'Add',
            body: {
              intA: 1,
              intB: 2
            }
          });
          expect(data.statusCode).toBe(200);
          expect(data.body.AddResult).toBe(3);
        });
      },
      CASSETTES_PATH
    );
    describeRecording(
      'Multiply',
      () => {
        it('Should multiply two numbers', async () => {
          const data = await client.request<any>({
            overwriteWsdl: WSDL_PATH,
            method: 'Multiply',
            body: {
              intA: 3,
              intB: 6
            }
          });

          expect(data.statusCode).toBe(200);
          expect(data.body.MultiplyResult).toBe(18);
        });
      },
      CASSETTES_PATH
    );
    describeRecording(
      'Errors',
      () => {
        it('Should throw a missing mandatory param exception - method', async () => {
          const req = client.request({
            method: '',
            body: {}
          });
          await expect(req).rejects.toThrowError(MissingMandatoryParamenter);
        });
        it('Should throw a missing soap method exception', async () => {
          const req = client.request({
            method: 'Addd',
            body: {}
          });
          await expect(req).rejects.toThrowError(MissingSoapMethod);
        });
        it('Should throw a bad client configuration exception', async () => {
          const client = new MonoClient({
            type: 'soap'
          });
          const req = client.request({
            body: {},
            method: 'any'
          });
          await expect(req).rejects.toThrowError(ClientBadConfiguration);
        });
        it('Should throw a soap exception - using SSL security', async () => {
          const sslClient = new MonoClient({
            type: 'soap',
            wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
            ssl: {
              type: 'ssl-security',
              key: Buffer.from(''),
              cert: Buffer.from('')
            }
          });
          const req = sslClient.request({
            body: {
              IntA: 1,
              IntB: 0
            },
            method: 'Divide'
          });
          await expect(req).rejects.toThrowError(RequestFail);
        });

        it('Should throw a soap exception - Using SSL PFX Security', async () => {
          const sslClient = new MonoClient({
            type: 'soap',
            wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
            ssl: {
              type: 'ssl-pfx-security',
              pfx: Buffer.from(''),
              passphrase: ''
            }
          });
          const req = sslClient.request({
            body: {
              IntA: 1,
              IntB: 0
            },
            method: 'Divide'
          });
          await expect(req).rejects.toThrowError(RequestFail);
        });
        it('Should throw a soap exception - Using SSL Security with CA', async () => {
          const sslClient = new MonoClient({
            type: 'soap',
            wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
            ssl: {
              type: 'ssl-security',
              key: Buffer.from(''),
              cert: Buffer.from(''),
              ca: 'src/test/factories/soap/ca.pem'
            }
          });
          const req = sslClient.request({
            body: {
              IntA: 1,
              IntB: 0
            },
            method: 'Divide',
            requestTimeout: 2000
          });
          await expect(req).rejects.toThrowError(RequestFail);
        });
      },
      CASSETTES_PATH
    );
    describeRecording(
      'Add with local wsdl',
      () => {
        it('Should sum two numbers', async () => {
          const client = new MonoClient({
            type: 'soap',
            wsdl: WSDL_PATH
          });
          const data = await client.request<any>({
            method: 'Add',
            body: {
              intA: 1,
              intB: 2
            }
          });
          expect(data.statusCode).toBe(200);
          expect(data.body.AddResult).toBe(3);
        });
      },
      CASSETTES_PATH
    );
  });
});
