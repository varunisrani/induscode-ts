import { afterEach, expect, it, vi } from 'vitest';
import { consoleTest } from '../test-support.js';
import { THEMES } from '../theme/resolve.js';
let view: Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>{view?.close();vi.restoreAllMocks()});
it('applies the persisted theme and switches its adapter live', async () => {
  for(const [scheme,theme] of Object.entries(THEMES)) {
    const original=theme.adapter.color.bind(theme.adapter);
    vi.spyOn(theme.adapter,'color').mockImplementation((key,text)=>key==='accent'?`[${scheme}]${text}`:original(key,text));
  }
  view=await consoleTest({settings:{colourScheme:'daylight'}});
  expect(view.last()).toContain('[daylight]');
  await view.key('/settings');await view.key('\r');await view.key('\x1b[C');await view.key('\x1b');
  expect(view.svc!.values.colourScheme).toBe('midnight-cb');
  expect(view.last()).toContain('[midnight-cb]');
});
