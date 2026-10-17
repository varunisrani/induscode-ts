import { afterEach, expect, it } from 'vitest';
import { consoleTest, fixtureConductor } from '../test-support.js';
let view: Awaited<ReturnType<typeof consoleTest>>;
afterEach(()=>view?.close());
it('keeps scrolled history anchored while new output arrives',async()=>{
 const c=fixtureConductor();
 const messages=(count:number)=>[{role:'assistant',content:[{type:'text',text:Array.from({length:count},(_,i)=>`LINE_${i}_END`).join('\n')}],timestamp:2,stopReason:'stop'}];
 c.setMessages(messages(60));view=await consoleTest({conductor:c});await view.key('\x1b[5~');
 const before=view.last().match(/LINE_\d+_END/g);
 c.setMessages(messages(70));c.emit({kind:'persisted'});await new Promise(r=>setTimeout(r,80));
 expect(view.last().match(/LINE_\d+_END/g)).toEqual(before);
});
it('keeps the input visible in a narrow tall terminal and after resize', async () => {
  view=await consoleTest({columns:40,rows:40,settings:{quietStartup:false}});
  expect(view.last()).toContain('›');
  expect(view.last().split('\n').length).toBeLessThanOrEqual(40);
  await view.resize(60,20);
  expect(view.last()).toContain('›');
  expect(view.last().split('\n').length).toBeLessThanOrEqual(20);
});
it('keeps a long transcript within terminal rows and allows scrolling back', async () => {
  const c=fixtureConductor();
  c.setMessages([{role:'user',content:'Short prompt',timestamp:1},{role:'assistant',content:[{type:'text',text:Array.from({length:60},(_,i)=>`LINE_${i}_END`).join('\n')}],timestamp:2,stopReason:'stop'}]);
  view=await consoleTest({conductor:c,settings:{quietStartup:false}});
  expect(view.last().split('\n').length).toBeLessThanOrEqual(24);
  expect(view.last()).toContain('LINE_59_END');
  const before=view.last();await view.key('\x1b[5~');
  expect(view.last()).not.toBe(before);
});

it('renders the final summary as readable markdown after a tool call', async () => {
  const c=fixtureConductor();
  c.setMessages([{
    role:'assistant', provider:'openai-codex', model:'gpt-6-sol', timestamp:1, stopReason:'toolUse',
    content:[{type:'toolCall',id:'read-1',name:'read',arguments:{path:'README.md'}}]
  },{
    role:'toolResult',toolCallId:'read-1',toolName:'read',timestamp:2,isError:false,
    content:[{type:'text',text:'README content loaded'}]
  },{
    role:'assistant', provider:'openai-codex', model:'gpt-6-sol', timestamp:3, stopReason:'stop',
    content:[{type:'text',text:'## Review summary\n\n**Prioritized findings**\n\n- Invalid tool names can enable the full tool deck.\n- Type-checking currently reports 138 errors.\n\n**Validation**\n\nAll 147 tests passed and the production build succeeded.'}]
  }]);
  view=await consoleTest({conductor:c,columns:120,rows:40});
  const frame=view.last();
  expect(frame).toContain('Read (README.md)');
  expect(frame).toContain('◆ Review summary');
  expect(frame).toContain('◆ Prioritized findings');
  expect(frame).toContain('• Invalid tool names');
  expect(frame).toContain('◆ Validation');
  expect(frame).toContain('All 147 tests passed');
});
