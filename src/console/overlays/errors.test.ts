import { afterEach, expect, it } from 'vitest';
import { consoleTest, fixtureConductor, fixtureServices } from '../test-support.js';
let view:Awaited<ReturnType<typeof consoleTest>>;afterEach(()=>view?.close());
it('surfaces a failed settings save without crashing or keeping an unsaved value',async()=>{
 const c=fixtureConductor(),svc=fixtureServices(c);const original=svc.values.colourScheme;
 svc.settings.save=()=>{throw new Error('SETTINGS_SAVE_FAILURE')};
 view=await consoleTest({conductor:c,services:svc});await view.key('/settings');await view.key('\r');await view.key('\x1b[C');
 expect(view.last()).toContain('SETTINGS_SAVE_FAILURE');expect(svc.values.colourScheme).toBe(original);expect(view.exited()).toBe(false);
});
it('surfaces model selection failures instead of silently dismissing them',async()=>{
 const c=fixtureConductor();c.selectModel=()=>{throw new Error('MODEL_SELECTION_FAILURE')};
 view=await consoleTest({conductor:c});await view.key('/model');await view.key('\r');await view.key('\r');
 expect(view.last()).toContain('MODEL_SELECTION_FAILURE');
});
