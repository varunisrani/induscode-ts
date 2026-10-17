import { afterEach, expect, it } from 'vitest';
import React from 'indusagi/react-host';
import { consoleTest, renderTest, settle } from '../test-support.js';
import { WorkingIndicator } from './WorkingIndicator.js';
import { rowGradient } from './banner-sweep.js';
import { BackgroundAgents } from './BackgroundAgents.js';
import { resolveTheme } from '../theme/resolve.js';
let view:any;
afterEach(()=>view?.close());
it('updates running-agent elapsed time without new model events',async()=>{
 view=await renderTest(React.createElement(BackgroundAgents,{theme:resolveTheme().adapter,runs:[{id:'clock',name:'timer',objective:'fixture',status:'running',startedAt:Date.now()-1000}]}));
 const before=Number(/(\d+)s/.exec(view.last())![1]);await settle(1150);
 expect(Number(/(\d+)s/.exec(view.last())![1])).toBeGreaterThan(before);
});
it('uses a stable working indicator when reduced motion is requested',async()=>{
 view=await renderTest(React.createElement(WorkingIndicator,{theme:resolveTheme().adapter,busy:true,reducedMotion:true} as any));
 expect(view.last()).toContain('Working…');
});
it('keeps the selected settings value visible on a narrow terminal',async()=>{
 view=await consoleTest({columns:32,rows:20});await view.key('/settings');await view.key('\r');await view.key('Editor padding');await view.key('\x1b[C');
 const selected=view.last().split('\n').find((line:string)=>line.includes('›'));
 expect(selected).toContain('2');
});
it('uses configured editor padding',async()=>{
 view=await consoleTest({settings:{editorPaddingX:3}});
 const input=view.last().split('\n').find((line:string)=>line.includes('›'));
 expect(input.indexOf('›')).toBe(4);
});
it('does not offer an unimplemented hardware-cursor switch',async()=>{
 view=await consoleTest();await view.key('/settings');await view.key('\r');await view.key('Hardware cursor');
 expect(view.last()).toContain('No settings matched');
});
it('interpolates the logo sweep instead of returning one color for every row',()=>{
 expect(rowGradient(0,3,'#000000','#ffffff')).toBe('#000000');
 expect(rowGradient(2,3,'#000000','#ffffff')).toBe('#ffffff');
});
it('keeps older running agents visible ahead of recent completed ones',async()=>{
 const runs=Array.from({length:9},(_,i)=>({id:String(i),name:i===0?'ACTIVE_OLD':'done'+i,objective:'fixture',status:i===0?'running':'done',startedAt:0}));
 view=await renderTest(React.createElement(BackgroundAgents,{theme:resolveTheme().adapter,runs:runs as any,now:0}));
 expect(view.last()).toContain('ACTIVE_OLD');
});
