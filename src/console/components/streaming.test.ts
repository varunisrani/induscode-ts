import { afterEach, expect, it } from 'vitest';
import { consoleTest, settle } from '../test-support.js';
let view: Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>view?.close());
it('renders live reasoning when the display setting is enabled', async () => {
  view=await consoleTest({settings:{showReasoning:true}});
  view.c.emit({kind:'thinking',delta:'THINKING_SENTINEL'});await settle();
  expect(view.last()).toContain('THINKING_SENTINEL');
  await view.key('\x14');
  expect(view.last()).not.toContain('THINKING_SENTINEL');
});
it('preserves the live answer prefix when another prompt is queued', async () => {
  view=await consoleTest();
  await view.key('first');await view.key('\r');
  view.c.emit({kind:'text',delta:'PREFIX_SENTINEL '});await settle();
  await view.key('followup');await view.key('\r');
  view.c.emit({kind:'text',delta:'SUFFIX_SENTINEL'});await settle();
  expect(view.last()).toContain('PREFIX_SENTINEL SUFFIX_SENTINEL');
});
