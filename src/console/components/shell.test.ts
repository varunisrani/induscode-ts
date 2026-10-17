import { afterEach, expect, it } from 'vitest';
import { consoleTest } from '../test-support.js';
let view: Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>view?.close());
it('renders inline shell stdout as well as the exit status',async()=>{
 view=await consoleTest();await view.key('! printf test');await view.key('\r');
 expect(view.last()).toContain('SHELL_SENTINEL');expect(view.last()).toContain('Shell exited 0.');
});
