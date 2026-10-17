// Offline fixture for scripts/test-tui-pty.py. Exercises the built public console mount.
import { consoleUi } from '../dist/index.js';
const mode=process.argv[2] ?? 'busy';
let phase='idle',handler=()=>{},finish,aborts=0;
const submissions=[];
const c={
  snapshot:()=>({phase,contextTokens:0,head:{sessionId:'pty-fixture',leaf:null},modelId:'fixture/model'}),
  model:()=>({id:'model',provider:'fixture',contextWindow:200000}),
  stats:()=>({tokens:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0},cost:0}),
  pendingCount:()=>0,pendingInputs:()=>[],thinkingLevel:()=> 'off',sessionName:()=>undefined,availableModels:()=>[],messages:()=>[],
  permissionMode:()=> 'default',setApprovalResolver:()=>{},subscribe:fn=>{handler=fn;return()=>{handler=()=>{}}},
  isBusy:()=>phase!=='idle',
  submit:async text=>{submissions.push(text);if(mode==='busy'){phase='streaming';await new Promise(r=>{finish=r})}else{handler({kind:'idle'})}},
  abort:()=>{aborts++;phase='idle';finish?.();handler({kind:'idle'})},
};
const services={conductor:c,settings:{get:key=>key==='quietStartup'?true:undefined},vault:{defaultAccount:async()=>undefined,listAccounts:async()=>[]},listLoginProviders:()=>[]};
const result=await consoleUi.mountConsole(c,{services,...mode==='busy'?{initialInput:'fixture prompt'}:{}});
process.stdout.write('\nPTY_RESULT '+JSON.stringify({mode,result,aborts,submissions,rawMode:process.stdin.isRaw})+'\n');
