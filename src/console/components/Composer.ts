/** Bounded, grapheme-aware editor and selection-following completion menu. */
import { Box, Text } from 'indusagi/react-host/ink';
import { jsx, jsxs } from 'indusagi/react-host/jsx-runtime';
import stringWidth from 'string-width';
import type { InkThemeAdapter } from 'indusagi/react-ink';
import type { Suggestion } from '../input/index.js';
import { snapGrapheme } from '../input/graphemes.js';
import { useTerminalSize } from './ScrollViewport.js';

const segmenter = new Intl.Segmenter(undefined, {granularity:'grapheme'});
interface Cell { text: string; caret: boolean }
function editorLines(buffer: string, caret: number, width: number) {
  const lines: Cell[][] = [[]];
  let column = 0;
  caret = snapGrapheme(buffer, caret);
  for (const {segment, index} of segmenter.segment(buffer + ' ')) {
    const cursor = index === caret;
    if (segment === '\n') {
      if (cursor) lines.at(-1)!.push({text:' ', caret:true});
      lines.push([]); column=0; continue;
    }
    const text = segment === '\t' ? '  ' : segment.replace(/[\x00-\x1f\x7f]/g,'');
    const cells = stringWidth(text);
    if (column + cells > width && column > 0) {lines.push([]);column=0;}
    lines.at(-1)!.push({text:cells > width ? '?' : text,caret:cursor});
    column += Math.min(width,cells);
  }
  return lines;
}

export interface ComposerProps {
  readonly theme: InkThemeAdapter;
  readonly buffer: string;
  readonly caret: number;
  readonly busy: boolean;
  readonly suggestions: readonly Suggestion[];
  readonly highlight: number;
  readonly paddingX?: number;
}

export function Composer({theme,buffer,caret,suggestions,highlight,paddingX=1}: ComposerProps) {
  const {columns,rows} = useTerminalSize();
  const padding = Math.max(0, Math.min(3, Math.floor(paddingX), Math.floor((columns-8)/2)));
  const sendWidth = columns >= 32 ? 7 : 0;
  const width = Math.max(1,columns - 2 - padding*2 - 2 - sendWidth);
  const allLines = editorLines(buffer,caret,width);
  const caretRow = Math.max(0,allLines.findIndex(line=>line.some(cell=>cell.caret)));
  const editorBudget = Math.max(1,Math.min(6,Math.floor(rows/4)));
  const top = Math.max(0,Math.min(caretRow-editorBudget+1,allLines.length-editorBudget));
  const lines = allLines.slice(top,top+editorBudget);
  const budget = Math.max(1,Math.min(8,rows-lines.length-12));
  const start = Math.max(0,Math.min(highlight-budget+1,suggestions.length-budget));
  const shown = suggestions.slice(start,start+budget);
  const nameWidth = Math.max(1,Math.min(24,Math.floor(columns/3)));
  return jsxs(Box,{flexDirection:'column',flexShrink:0,children:[
    jsx(Box,{borderStyle:'round',borderColor:theme.colors.borderMuted??'gray',paddingX:padding,flexDirection:'column',children:
      lines.map((line,index)=>jsxs(Box,{height:1,flexShrink:0,children:[
        jsx(Box,{width:2,flexShrink:0,children:jsx(Text,{children:theme.color('customMessage',index+top===0?'› ':'· ')})}),
        jsx(Box,{width,flexShrink:0,children:jsx(Text,{wrap:'truncate-end',children:line.map((cell,i)=>jsx(Text,{inverse:cell.caret,children:cell.text},i))})}),
        sendWidth ? jsx(Box,{width:sendWidth,flexShrink:0,children:jsx(Text,{children:index===0?theme.dim(' ↵ send'):''})}) : null
      ]},index))
    }),
    shown.length ? jsx(Box,{flexDirection:'column',marginTop:1,children:shown.map((suggestion,index)=>jsxs(Box,{height:1,children:[
      jsx(Box,{width:2,flexShrink:0,children:jsx(Text,{children:start+index===highlight?theme.color('accent','▸'):' '})}),
      jsx(Box,{width:nameWidth,flexShrink:0,children:jsx(Text,{wrap:'truncate-end',bold:start+index===highlight,children:theme.color('customMessage',suggestion.label)})}),
      jsx(Box,{width:Math.max(1,columns-nameWidth-2),children:jsx(Text,{wrap:'truncate-end',children:theme.muted('  '+suggestion.detail)})})
    ]},suggestion.value))}) : null
  ]});
}
