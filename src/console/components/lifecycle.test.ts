import { afterEach, expect, it } from 'vitest';
import { consoleTest, settle } from '../test-support.js';
let view:Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>view?.close());
it('clears live output and UI blocks when a fresh session replaces a running view',async()=>{
 view=await consoleTest();await view.key('first');await view.key('\r');
 view.c.emit({kind:'text',delta:'OLD_STREAM_SENTINEL'});await settle();
 await view.key('/new');await view.key('\r');
 expect(view.last()).not.toContain('OLD_STREAM_SENTINEL');
});
it('shows async slash errors and restores control instead of rejecting unhandled',async()=>{
 const bad={name:'failure',summary:'fixture',run:async()=>{throw new Error('COMMAND_FAILURE_SENTINEL')}};
 view=await consoleTest({props:{slash:{commands:[bad],index:new Map([['failure',bad]])}}});
 await view.key('/failure');await view.key('\r');
 expect(view.last()).toContain('COMMAND_FAILURE_SENTINEL');
});
it('interrupts from a modal rather than silently ignoring Ctrl+C',async()=>{
 view=await consoleTest();await view.key('first');await view.key('\r');
 await view.key('/settings');await view.key('\r');await view.key('\x03');
 expect(view.c.aborted).toBe(1);expect(view.exited()).toBe(false);
});
