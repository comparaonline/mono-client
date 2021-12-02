import { HttpRecorder } from 'nock-utils';
import { join } from 'path';

type TestCases = (recorder: HttpRecorder) => void;

function callerName(): string {
  const error = new Error();
  const pathCaller = error.stack?.split('\n')[3];
  const fileCaller = pathCaller?.split('/').pop()?.split('.')[0];
  return fileCaller ?? 'test';
}

function descriptionToName(description: string): string {
  return description.toLowerCase().replace(/\s/g, '-');
}

export function describeRecording(
  description: string,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  cases: TestCases = (): void => {},
  path = ''
): void {
  const dir = callerName();
  const name = descriptionToName(description);
  const fullPath = join(__dirname, '..', 'cassettes', path, `${dir}.${name}.json`);
  const recorder = new HttpRecorder(fullPath);
  describe(description, () => {
    beforeAll(() => recorder.start());
    afterAll(() => recorder.stop(true));
    cases(recorder);
  });
}
