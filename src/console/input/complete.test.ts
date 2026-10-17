import { expect, it } from 'vitest';
import { completeAt } from './complete.js';
const registry={commands:[],index:new Map()};
it.each([['@/fi','/','@/file.txt'],['@/tmp/fi','/tmp','@/tmp/file.txt'],['@~/fi','~','@~/file.txt']])('preserves path root for %s',(input,expectedDir,expectedValue)=>{
 let queried='';const result=completeAt(input,input.length,registry,dir=>{queried=dir;return [{name:'file.txt',isDir:false}]});
 expect(queried).toBe(expectedDir);expect(result.suggestions[0].value).toBe(expectedValue);
});
