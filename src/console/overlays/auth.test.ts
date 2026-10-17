import { afterEach, expect, it, vi } from 'vitest';
import { consoleTest, fixtureConductor, fixtureServices, settle } from '../test-support.js';
vi.mock('../../boot/server-token.js',async importOriginal=>({...await importOriginal<any>(),getServerToken:async()=>null,hasValidServerToken:async()=>false,clearServerToken:vi.fn(async()=>true)}));
let view:Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>{view?.close();vi.restoreAllMocks()});
it('aborts a closed OAuth flow and prevents late routing/model changes',async()=>{
 const c=fixtureConductor(),svc:any=fixtureServices(c);let callbacks:any,finish!:()=>void;
 svc.listLoginProviders=()=>[{id:'fixture',label:'Fixture',authKind:'oauth'}];
 svc.startOAuthLogin=async(_provider:any,cb:any)=>{callbacks=cb;await new Promise<void>(resolve=>finish=resolve)};
 svc.refreshGatewayRouting=vi.fn(async()=>{});c.selectModel=vi.fn();
 view=await consoleTest({conductor:c,services:svc});await view.key('/login fixture');await view.key('\r');await settle();
 await view.key('\x1b');finish();await settle();
 expect(callbacks.signal?.aborted).toBe(true);expect(svc.refreshGatewayRouting).not.toHaveBeenCalled();expect(c.selectModel).not.toHaveBeenCalled();
});
it('refreshes gateway routing after API-key save',async()=>{
 const c=fixtureConductor(),svc:any=fixtureServices(c);svc.vault.putApiKey=vi.fn(async()=>{});svc.refreshGatewayRouting=vi.fn(async()=>{});c.selectModel=vi.fn();
 view=await consoleTest({conductor:c,services:svc});await view.key('/login fixture');await view.key('\r');await settle();
 await view.key('test-placeholder-not-a-key');await view.key('\r');await settle();
 expect(svc.vault.putApiKey).toHaveBeenCalledOnce();expect(svc.refreshGatewayRouting).toHaveBeenCalledOnce();
});
it('refreshes gateway routing after logout',async()=>{
 const c=fixtureConductor(),svc:any=fixtureServices(c);svc.vault.remove=vi.fn(async()=>{});svc.refreshGatewayRouting=vi.fn(async()=>{});
 view=await consoleTest({conductor:c,services:svc});await view.key('/logout');await view.key('\r');await settle();await view.key('\r');await settle();
 expect(svc.vault.remove).toHaveBeenCalledOnce();expect(svc.refreshGatewayRouting).toHaveBeenCalledOnce();
});
