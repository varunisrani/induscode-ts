import { afterEach, expect, it, vi } from 'vitest';
import { runServerTierLogin } from './login.js';
afterEach(()=>vi.unstubAllGlobals());
it('does not start a network/device flow after cancellation',async()=>{
 const fetcher=vi.fn(async()=>Response.json({device_code:'fixture',user_code:'fixture',expires_in:30}));vi.stubGlobal('fetch',fetcher);
 const controller=new AbortController();controller.abort();
 await expect(runServerTierLogin({signal:controller.signal,onPrompt:async()=>'',onAuth:()=>{throw new Error('fixture prevents polling')}},'https://invalid.example')).rejects.toThrow();
 expect(fetcher).not.toHaveBeenCalled();
});
