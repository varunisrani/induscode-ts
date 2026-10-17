import { afterEach, expect, it } from 'vitest';
import React from 'indusagi/react-host';
import { Composer } from './Composer.js';
import { renderTest } from '../test-support.js';
import { resolveTheme } from '../theme/resolve.js';
let view: Awaited<ReturnType<typeof renderTest>>;
afterEach(()=>view?.close());
it('renders a bounded editor with the caret visible for long and multiline input', async () => {
 const buffer='abcdefgh '.repeat(30)+'\nLAST_LINE';
 view=await renderTest(React.createElement(Composer,{theme:resolveTheme().adapter,buffer,caret:buffer.length,busy:false,suggestions:[],highlight:0}),40,20);
 expect(view.last().split('\n').length).toBeLessThanOrEqual(8);
 expect(view.last()).toContain('LAST_LINE');
});
it('windows suggestions around the highlighted entry', async () => {
 const suggestions=Array.from({length:12},(_,i)=>({value:`/cmd${i}`,label:`/cmd${i}`,detail:'test',isDir:false}));
 view=await renderTest(React.createElement(Composer,{theme:resolveTheme().adapter,buffer:'/',caret:1,busy:false,suggestions,highlight:8}));
 expect(view.last()).toContain('▸');expect(view.last()).toContain('/cmd8');
});
