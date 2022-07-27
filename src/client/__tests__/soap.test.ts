import { MonoClient } from '..';
import {
  ClientBadConfiguration,
  MissingMandatoryParamenter,
  MissingSoapMethod,
  RequestFail
} from '../../exceptions';
import { describeRecording } from '@comparaonline/test-helpers';
import { join } from 'path';
import { HttpClient } from 'soap';

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
    describeRecording(
      'force namespace',
      () => {
        it('Should quote', async () => {
          const client = new MonoClient({
            type: 'soap',
            wsdl: 'https://integraparceiro.travelace.com.br/TravelAceService.svc?wsdl'
          });
          const additionalRequestOptions = {
            rejectUnauthorized: false,
            strictSSL: false,
            overrideRootElement: {
              namespace: 'tnsa',
              xmlnsAttributes: [
                {
                  name: 'xmlns:tnsa',
                  value: 'https://integraparceiro.travelace.com.br'
                },
                {
                  name: 'xmlns:arr',
                  value: 'http://schemas.microsoft.com/2003/10/Serialization/Arrays'
                },
                {
                  name: 'xmlns:trav',
                  value:
                    'http://schemas.datacontract.org/2004/07/TravelAce.InTravel.IntegraParceiro'
                }
              ]
            }
          };
          const passengers = [22, 25, 30].map(() => ({
            'trav:DataNascimento': '1999-01-01',
            'trav:Nome': 'Test Passenger'
          }));
          const data = await client.request<any>({
            method: 'SimulacaoCompra',
            body: {
              'tnsa:request': {
                'trav:Classificacoes': {
                  'arr:int': 4
                },
                'trav:DataRetorno': '2022-05-21',
                'trav:DataSaida': '2022-05-12',
                'trav:Destinos': {
                  ':arr:string': ['fr', 'za', 'cn']
                },
                'trav:Passageiros': {
                  'trav:PassageiroRequest': passengers
                },
                'trav:TipoTarifa': 1,
                'trav:TipoViagem': 1
              },
              'tns:autenticacao': {
                'trav:Senha': 'compara123456',
                'trav:Usuario': 'williamsilva'
              }
            },
            additionalRequestOptions
          });
          expect(data.statusCode).toBe(200);
          expect(data.body.SimulacaoCompraResult.Produtos.ProdutoCotacao).toEqual(
            expect.any(Array)
          );
        });
      },
      CASSETTES_PATH
    );
  });
});
describe('Change endpoint', () => {
  const client = new MonoClient({
    type: 'soap',
    wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL'
  });
  it('Change wsdl', async () => {
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
    const data = await client.request<any>({
      overwriteWsdl: WSDL_PATH,
      method: 'Multiply',
      body: {
        intA: 3,
        intB: 6
      },
      overwriteEndpoint: 'https:newHost'
    });
    expect(data.statusCode).toBe(200);
    expect(data.body.MultiplyResult).toBe(20);
    jest.restoreAllMocks();
  });
  it('No change wsdl', async () => {
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
    const data = await client.request<any>({
      method: 'Multiply',
      body: {
        intA: 3,
        intB: 6
      },
      overwriteEndpoint: 'https:newHost'
    });
    expect(data.statusCode).toBe(200);
    expect(data.body.MultiplyResult).toBe(20);
    jest.restoreAllMocks();
  });
});
