import { MonoClientRequest, RestRequest } from '../interfaces';

export function formatResponseErrorMessage(
  type: 'soap' | 'rest',
  error: Error,
  request: MonoClientRequest
): string {
  if (type === 'rest') {
    const req = request as RestRequest;
    if (req.responseType === 'arraybuffer') {
      return 'Error downloading array buffer';
    }
  }
  return error.message;
}

export function delay(secondsToWait: number): Promise<any> {
  const oneSecondInMilliseconds = 1000;
  const timeToWait = secondsToWait * oneSecondInMilliseconds;
  return new Promise((resolve) => setTimeout(resolve, timeToWait));
}
