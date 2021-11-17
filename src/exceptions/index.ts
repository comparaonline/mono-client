import { Request, Response } from '../interfaces';

export class InvalidMaxRetry extends Error {
  constructor(config: number) {
    super(`Invalid request max retry ${config}`);
  }
}

export class MissingPathParameter extends Error {
  constructor(public url: string, public param: string) {
    super(`Missing path parameters - ${param}`);
  }
}

export class RequestFail extends Error {
  constructor(public request: Request, public response: Response) {
    super(`Request Fail - ${response.statusCode} - ${response.body}`);
  }
}

export class ClientBadConfiguration extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class MissingSoapMethod extends Error {
  constructor(method: string) {
    super(`Missing method "${method}" inside of WSDL`);
  }
}

export class MissingMandatoryParamenter extends Error {
  constructor(public param: string) {
    super(`Missing or invalid mandatory parameter - ${param}`);
  }
}
