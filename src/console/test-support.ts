import { Writable, PassThrough } from 'node:stream';
import React from 'indusagi/react-host';
import { render } from 'indusagi/react-host/ink';
import stripAnsi from 'strip-ansi';
import { TerminalConsole } from './components/TerminalConsole.js';
import { resolveTheme } from './theme/resolve.js';
import { DEFAULT_SLASH_REGISTRY } from './slash/index.js';
import { DEFAULT_PREFERENCES } from '../settings/contract.js';
export const settle = (ms=55) => new Promise<void>(r=>setTimeout(r,ms));
export function fixtureConductor() {
  let handler=(signal:any)=>{}, phase='idle', messages:any[]=[], queue:any[]=[], sessionId='fixture';
  const model={id:'test-model',provider:'fixture',contextWindow:200000,name:'Fixture',reasoning:true};
  const submissions:string[]=[];
  const c:any={snapshot:()=>({phase,contextTokens:0,head:{sessionId,leaf:null},modelId:'fixture/test-model'}),model:()=>model,
    stats:()=>({sessionId,userMessages:0,assistantMessages:0,toolCalls:0,toolResults:0,totalMessages:messages.length,tokens:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0},cost:0}),
    pendingCount:()=>queue.length,pendingInputs:()=>queue,thinkingLevel:()=> 'off',sessionName:()=>undefined,availableModels:()=>[model],messages:()=>messages,isBusy:()=>phase!=='idle',
    permissionMode:()=> 'default',setApprovalResolver:(r:any)=>{c.approvalResolver=r},subscribe:(fn:any)=>{handler=fn;return()=>{handler=()=>{}}},
    submit:async(text:string)=>{submissions.push(text);if(phase==='streaming'){queue.push({text,mode:'followUp'});handler({kind:'queue',count:queue.length})}else{phase='streaming'}},
    emit:(sig:any)=>handler(sig),setMessages:(m:any[])=>{messages=m},setPhase:(p:string)=>{phase=p},submissions,
    abort:()=>{c.aborted=(c.aborted??0)+1;phase='idle';handler({kind:'idle'})},
    cyclePermissionMode:()=> 'acceptEdits',cycleThinkingLevel:()=> 'low',dequeueLast:()=>queue.pop()?.text,steerNow:()=>false,
    newSession:async()=>{messages=[];phase='idle';sessionId+='-new';handler({kind:'idle'})},executeBash:async()=>({exitCode:0,output:'SHELL_SENTINEL'})};
  return c;
}
export function fixtureServices(c:any, overrides:any={}) {
  const values:any={...DEFAULT_PREFERENCES,quietStartup:true,lastSeenVersion:'0.2.14',defaultProvider:'fixture',...overrides};
  return {conductor:c,settings:{get:(k:string)=>values[k],set:(k:string,v:any)=>{values[k]=v},save:()=>{}},vault:{defaultAccount:async()=>undefined,listAccounts:async()=>['fixture-account']},listLoginProviders:()=>[{id:'fixture',label:'Fixture',authKind:'apiKey'}],values};
}
export async function renderTest(element:any,columns=80,rows=24) {
  const frames:string[]=[];
  const stdout=new Writable({write(chunk,_enc,cb){frames.push(String(chunk));cb()}});
  Object.assign(stdout,{columns,rows,isTTY:true});
  const stdin=new PassThrough();Object.assign(stdin,{isTTY:true,setRawMode:()=>{},ref:()=>{},unref:()=>{}});
  const app=render(element,{stdout:stdout as unknown as NodeJS.WriteStream,stdin:stdin as unknown as NodeJS.ReadStream,stderr:stdout as unknown as NodeJS.WriteStream,debug:true,patchConsole:false,exitOnCtrlC:false});
  let exited=false;void app.waitUntilExit().then(()=>{exited=true});
  await settle(80);
  return {app,frames,stdout,stdin,exited:()=>exited,
    last:()=>stripAnsi(frames.filter(f=>f.length>10).at(-1)||''),raw:()=>frames.filter(f=>f.length>10).at(-1)||'',
    key:async(text:string)=>{stdin.write(text);await settle()},
    resize:async(cols:number,r:number)=>{Object.assign(stdout,{columns:cols,rows:r});stdout.emit('resize');await settle()},
    close:()=>{app.unmount();app.cleanup();stdin.destroy();stdout.destroy()}};
}
export async function consoleTest(options:any={}) {
  const c=options.conductor??fixtureConductor();
  const svc=options.services===false?undefined:(options.services??fixtureServices(c,options.settings));
  const view=await renderTest(React.createElement(TerminalConsole,{conductor:c,theme:resolveTheme('saffron'),slash:DEFAULT_SLASH_REGISTRY,services:svc,...options.props}),options.columns??80,options.rows??24);
  return {...view,c,svc};
}
