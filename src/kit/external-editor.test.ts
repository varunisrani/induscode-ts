import { expect, it, vi } from 'vitest';
import { openInExternalEditor } from './external-editor.js';
const spawn=vi.hoisted(()=>vi.fn(()=>({status:0})));
vi.mock('node:child_process',()=>({spawnSync:spawn}));
it('hands the terminal to the editor and restores raw mode even on failure',()=>{
 const modes:boolean[]=[],writes:string[]=[];
 const stdin={isRaw:true,setRawMode:(mode:boolean)=>modes.push(mode)};
 const stdout={isTTY:true,write:(text:string)=>writes.push(text)};
 expect(openInExternalEditor('fixture',{env:{EDITOR:'fixture'},terminal:{stdin,stdout}} as any)).toBe('fixture');
 expect(modes).toEqual([false,true]);expect(writes.join('')).toContain('\x1b[?25h');
 modes.length=0;spawn.mockImplementationOnce(()=>{throw new Error('fixture failure')});
 expect(openInExternalEditor('fixture',{env:{EDITOR:'fixture'},terminal:{stdin,stdout}} as any)).toBeNull();
 expect(modes).toEqual([false,true]);
});
