import { expect, it, vi } from 'vitest';
vi.mock('../../../boot/server-token.js',async importOriginal=>({...await importOriginal<any>(),hasValidServerToken:async()=>false}));
import { integrationCommands } from './integrations.js';
it('reports status from the supplied profile vault rather than a hardcoded auth file',async()=>{
 const setStatus=vi.fn();
 const ctx={args:'',setStatus,conductor:{snapshot:()=>({modelId:'fixture/test-model'})},services:{vault:{listAccounts:async()=>['fixture']}}};
 integrationCommands.find(c=>c.name==='status')!.run(ctx as any);
 await vi.waitFor(()=>expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({text:expect.stringContaining('local key')})));
});
