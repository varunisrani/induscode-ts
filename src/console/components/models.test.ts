import { afterEach, expect, it, vi } from 'vitest';
import { consoleTest, fixtureConductor, fixtureServices } from '../test-support.js';
let view: Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>{view?.close();vi.unstubAllEnvs()});
it('recognizes an environment-authenticated model without a saved account',async()=>{
 vi.stubEnv('OPENAI_API_KEY','fixture-only');const c=fixtureConductor();
 c.availableModels=()=>[{provider:'openai',id:'ENV_MODEL_SENTINEL',name:'Fixture'}];
 const svc=fixtureServices(c);svc.vault.listAccounts=async()=>[];
 view=await consoleTest({conductor:c,services:svc});await view.key('/model');await view.key('\r');
 expect(view.last()).toContain('ENV_MODEL_SENTINEL');
});
it('shows models authenticated by the injected profile vault',async()=>{
 view=await consoleTest();await view.key('/model');await view.key('\r');
 expect(view.last()).toContain('test-model');expect(view.last()).not.toContain('No models available');
});
it('shows GPT-6 Astra and Sol on both authenticated OpenAI routes',async()=>{
 vi.stubEnv('OPENAI_API_KEY','fixture-only');
 const c=fixtureConductor();
 c.availableModels=()=>[
  {provider:'openai',id:'gpt-6-astra',name:'GPT-6 Astra'},
  {provider:'openai-codex',id:'gpt-6-astra',name:'GPT-6 Astra'},
  {provider:'openai',id:'gpt-6-sol',name:'GPT-6 Sol'},
  {provider:'openai-codex',id:'gpt-6-sol',name:'GPT-6 Sol'},
 ];
 const svc=fixtureServices(c);
 svc.listLoginProviders=()=>[{id:'openai-codex',label:'OpenAI Codex',authKind:'oauth'}];
 svc.vault.listAccounts=async()=>['codex-oauth'];
 view=await consoleTest({conductor:c,services:svc});await view.key('/model');await view.key('\r');
 const frame=view.last();
 expect(frame.match(/gpt-6-astra/g)).toHaveLength(2);
 expect(frame.match(/gpt-6-sol/g)).toHaveLength(2);
 expect(frame).toContain('openai');expect(frame).toContain('openai-codex');
});
it('shows GPT-6 Luna on both OpenAI and Codex routes in /model',async()=>{
 vi.stubEnv('OPENAI_API_KEY','fixture-only');
 const c=fixtureConductor();
 c.availableModels=()=>[
  {provider:'openai',id:'gpt-6-luna',name:'GPT-6 Luna'},
  {provider:'openai-codex',id:'gpt-6-luna',name:'GPT-6 Luna'},
 ];
 const svc=fixtureServices(c);svc.vault.listAccounts=async()=>['codex-oauth'];
 view=await consoleTest({conductor:c,services:svc});await view.key('/model');await view.key('\r');
 const frame=view.last();
 expect(frame).toContain('GPT-6 Luna');
 expect(frame.match(/gpt-6-luna/g)).toHaveLength(2);
 expect(frame).toContain('openai');
 expect(frame).toContain('openai-codex');
});
