import { expect, it } from 'vitest';
import { ModelCatalog, ModelMatcher } from './catalog/index.js';
import { createSessionConductor, type AgentLike } from './conductor.js';
it('records inline shell output in current context and cancels a running shell',async()=>{
 const model=new ModelMatcher(new ModelCatalog()).resolveCard('openai/gpt-6-astra')!.model;
 const state:any={messages:[],model,isStreaming:false};
 const agent:AgentLike={state,subscribe:()=>()=>{},prompt:async()=>{},abort:()=>{},replaceMessages:m=>{state.messages=[...m]},setModel:()=>{},setSystemPrompt:()=>{},setTools:()=>{}};
 const c=createSessionConductor({modelId:'openai/gpt-6-astra',autoCompact:false},{agent});
 const outcome=await c.executeBash('printf TUI_SHELL_CONTEXT');expect(outcome.output).toBe('TUI_SHELL_CONTEXT');
 expect(JSON.stringify(c.messages())).toContain('TUI_SHELL_CONTEXT');
 const abort=new AbortController();const start=Date.now();
 const running=c.executeBash('sleep 10',{signal:abort.signal} as any);setTimeout(()=>abort.abort(),30);
 const cancelled=await running;expect(cancelled.exitCode).not.toBe(0);expect(Date.now()-start).toBeLessThan(2000);
});
it('waits for an aborted turn before replacing session state',async()=>{
 const model=new ModelMatcher(new ModelCatalog()).resolveCard('openai/gpt-6-astra')!.model;
 let release!:()=>void;const stopped=new Promise<void>(r=>release=r);
 const state:any={messages:[],model,isStreaming:false};
 const agent:AgentLike={state,subscribe:()=>()=>{},prompt:async()=>{await stopped;state.messages.push({role:'user',content:'LATE_OLD_TURN',timestamp:1})},abort:()=>{setTimeout(release,5)},replaceMessages:m=>{state.messages=[...m]},setModel:()=>{},setSystemPrompt:()=>{},setTools:()=>{}};
 const c=createSessionConductor({modelId:'openai/gpt-6-astra',autoCompact:false},{agent});
 const running=c.submit('old');await c.newSession();await running;
 expect(c.messages()).toEqual([]);expect(c.snapshot().phase).toBe('idle');
});
it('settles phase after cancelling compaction',async()=>{
 const model=new ModelMatcher(new ModelCatalog()).resolveCard('openai/gpt-6-astra')!.model;
 const agent:AgentLike={state:{messages:[],model,isStreaming:false},subscribe:()=>()=>{},prompt:async()=>{},abort:()=>{},replaceMessages:()=>{},setModel:()=>{},setSystemPrompt:()=>{},setTools:()=>{}};
 const c=createSessionConductor({modelId:'openai/gpt-6-astra'},{agent,condense:async(messages,opts)=>{await new Promise<void>(resolve=>opts!.signal!.addEventListener('abort',()=>resolve(),{once:true}));return messages}});
 const pending=c.condense();c.cancelCondense();expect(await pending).toBe('cancelled');expect(c.snapshot().phase).toBe('idle');
});
it('cycles models relative to the current selection in both directions',()=>{
 const matcher=new ModelMatcher(new ModelCatalog());const cards=matcher.resolveAll('');
 const first=cards[0].id,second=cards[1].id;
 const agent:AgentLike={state:{messages:[],model:matcher.resolveCard(first)!.model,isStreaming:false},subscribe:()=>()=>{},prompt:async()=>{},abort:()=>{},replaceMessages:()=>{},setModel:()=>{},setSystemPrompt:()=>{},setTools:()=>{}};
 const c=createSessionConductor({modelId:first},{agent,matcher});
 c.cycleModel!('');expect(c.snapshot().modelId).toBe(second);
 (c.cycleModel as any)('',-1);expect(c.snapshot().modelId).toBe(first);
});
