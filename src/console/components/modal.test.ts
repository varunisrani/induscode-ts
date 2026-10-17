import { afterEach, expect, it, vi } from 'vitest';
import { consoleTest, fixtureConductor, settle } from '../test-support.js';
let view: Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>view?.close());
it('removes an approval abort listener once the decision is settled',async()=>{
 view=await consoleTest();const controller=new AbortController();
 const remove=vi.spyOn(controller.signal,'removeEventListener');
 const result=view.c.approvalResolver('read',{path:'fixture'},{signal:controller.signal});await settle();await view.key('\r');
 expect(await result).toBe('allow-once');expect(remove).toHaveBeenCalledWith('abort',expect.any(Function));
});
it('can dismiss a service-dependent overlay when services are absent',async()=>{
 view=await consoleTest({services:false});await view.key('/settings');await view.key('\r');
 await view.key('\x1b');await view.key('RECOVERY_SENTINEL');
 expect(view.last()).toContain('RECOVERY_SENTINEL');
});
it('gives an approval overlay sole keyboard ownership above agent details',async()=>{
 const c=fixtureConductor();c.setMessages([{role:'assistant',content:[{type:'toolCall',id:'task-1',name:'task',arguments:{agent:'worker',objective:'fixture'}}],timestamp:1}]);
 view=await consoleTest({conductor:c});await view.key('\x1b[D');
 const approval=c.approvalResolver('read',{path:'fixture'},{});await settle();await view.key('\x1b');
 expect(await approval).toBe('deny');await settle();
 expect(view.last()).toContain('Enter on main');
});
