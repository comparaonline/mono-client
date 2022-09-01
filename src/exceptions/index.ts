import { formatResponseErrorMessage } from '../helpers';
import { MonoClientRequest, MonoClientResponse } from '../interfaces';

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
  constructor(
    public type: 'soap' | 'rest',
    public request: MonoClientRequest,
    public response: MonoClientResponse,
    public error: Error
  ) {
    super(
      `Request Fail - ${response.statusCode} - ${formatResponseErrorMessage(type, error, request)}`
    );
  }
}

export class BodyParserFail extends Error {
  constructor(
    public type: 'soap' | 'rest',
    public request: MonoClientRequest,
    public response: MonoClientResponse,
    public error: Error
  ) {
    super(`Body Parser - ${error.message}`);
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

export class MissingMandatoryParameter extends Error {
  constructor(public param: string) {
    super(`Missing or invalid mandatory parameter - ${param}`);
  }
}
