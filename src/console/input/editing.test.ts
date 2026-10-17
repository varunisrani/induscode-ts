import { expect, it } from 'vitest';
import { consoleReducer, initConsoleState } from '../reducer.js';
import { readKey } from './keymap.js';
it.each(['😀','👩🏽‍💻','e\u0301'])('moves and deletes whole grapheme %s', grapheme => {
  let state=initConsoleState({buffer:`a${grapheme}b`,caret:1+grapheme.length});
  expect(consoleReducer(state,{type:'buffer:erasePrev'}).buffer).toBe('ab');
  state=consoleReducer(state,{type:'caret:move',delta:-1});expect(state.caret).toBe(1);
  expect(consoleReducer(state,{type:'buffer:eraseNext'}).buffer).toBe('ab');
});
it('maps forward Delete independently of Backspace',()=>{
  expect(readKey('',{delete:true} as any).verb).toBe('edit:eraseNext');
  expect(readKey('',{backspace:true} as any).verb).toBe('edit:erasePrev');
});
