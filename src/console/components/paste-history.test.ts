import { afterEach, expect, it } from 'vitest';
import { consoleTest } from '../test-support.js';
let view: Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>view?.close());
it('recalls the original large paste rather than an orphaned marker', async () => {
  view=await consoleTest();const body='paste-body-'.repeat(120);
  await view.key(body);await view.key('\r');view.c.setPhase('idle');view.c.emit({kind:'idle'});
  await view.key('\x1b[A');await view.key('\r');
  expect(view.c.submissions).toEqual([body,body]);
});
