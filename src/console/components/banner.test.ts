import { afterEach, expect, it } from 'vitest';
import React from 'indusagi/react-host';
import { Banner } from './Banner.js';
import { renderTest } from '../test-support.js';
import { resolveTheme } from '../theme/resolve.js';
import { DEFAULT_SLASH_REGISTRY } from '../slash/index.js';
let view:any;afterEach(()=>view?.close());
it('shows the discovered startup resource counts',async()=>{
 view=await renderTest(React.createElement(Banner,{theme:resolveTheme().adapter,modelId:'fixture/model',workspace:'/tmp/test',version:'test',quiet:true,startup:{sections:[{title:'Skills',lines:['one','two'],count:2}]}}));
 expect(view.last()).toContain('Skills: 2');
});
it('resolves the release-notes command advertised in the banner',()=>{
 expect(DEFAULT_SLASH_REGISTRY.index.get('release-notes')?.name).toBe('whats-new');
});
