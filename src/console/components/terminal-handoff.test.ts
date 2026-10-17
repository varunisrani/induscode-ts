import { afterEach, expect, it, vi } from 'vitest';
import { consoleTest, settle } from '../test-support.js';
let view:Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>{process.emit('SIGCONT');view?.close();vi.restoreAllMocks()});
it.skipIf(process.platform==='win32')('restores cooked mode for suspension and raw mode after resume',async()=>{
 vi.spyOn(process,'kill').mockReturnValue(true);
 view=await consoleTest();Object.assign(view.stdin,{isRaw:true});
 const modes=vi.spyOn(view.stdin as any,'setRawMode');
 await view.key('\x1a');expect(modes).toHaveBeenCalledWith(false);
 process.emit('SIGCONT');await settle();expect(modes).toHaveBeenLastCalledWith(true);
 expect(view.last()).toContain('Resumed');
});
