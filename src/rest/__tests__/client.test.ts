import { RestClient } from '..';
import { ClientBadConfiguration } from '../../exceptions';

describe('Rest base client', () => {
  it('Should throw an exception by rest config', async () => {
    const client = new RestClient({
      type: 'soap'
    });
    const req = client.request({ path: '/' });
    await expect(req).rejects.toThrowError(ClientBadConfiguration);
  });
});
