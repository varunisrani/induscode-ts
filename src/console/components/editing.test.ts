import { afterEach, expect, it } from 'vitest';
import { consoleTest } from '../test-support.js';
let view:Awaited<ReturnType<typeof consoleTest>>;afterEach(()=>view?.close());
it('distinguishes the terminal Backspace byte from the forward Delete escape sequence',async()=>{
 view=await consoleTest();await view.key('ab😀');await view.key('\x7f');await view.key('\x1b[D');await view.key('\x1b[3~');await view.key('\r');
 expect(view.c.submissions).toEqual(['a']);
});
