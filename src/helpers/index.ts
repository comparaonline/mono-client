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
