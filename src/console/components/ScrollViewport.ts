import React, { useEffect, useState } from 'indusagi/react-host';
import { Box, useInput } from 'indusagi/react-host/ink';
import { measureElement, useStdout, type DOMElement } from 'ink';
import { jsx } from 'indusagi/react-host/jsx-runtime';
import type { ReactNode } from 'react';

export function useTerminalSize() {
  const { stdout } = useStdout();
  const read = () => ({ columns: Math.max(1, stdout.columns || 80), rows: Math.max(1, stdout.rows || 24) });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const resize = () => setSize(read());
    stdout.on('resize', resize);
    return () => { stdout.off('resize', resize); };
  }, [stdout]);
  return size;
}

/** Row-bounded Ink viewport. Page keys scroll; new output follows only at the bottom. */
export function ScrollViewport({ children, active = true, follow = true }: { children: ReactNode; active?: boolean; follow?: boolean }) {
  const outer = React.useRef<DOMElement>(null);
  const inner = React.useRef<DOMElement>(null);
  const [metrics, setMetrics] = useState({ height: 1, content: 1 });
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!outer.current || !inner.current) return;
    const height = measureElement(outer.current).height;
    const content = measureElement(inner.current).height;
    if (metrics.height !== height || metrics.content !== content) {
      const oldMax = Math.max(0, metrics.content - metrics.height);
      const newMax = Math.max(0, content - height);
      if (follow) setOffset(n => n === 0 ? 0 : Math.max(0, Math.min(newMax, n + newMax - oldMax)));
      setMetrics({height, content});
    }
  });
  const max = Math.max(0, metrics.content - metrics.height);
  const scroll = Math.min(max, offset);
  useInput((_input, key) => {
    const step = Math.max(1, metrics.height - 2);
    if (key.pageUp) setOffset(n => Math.min(max, n + (follow ? step : -step)));
    if (key.pageDown) setOffset(n => Math.max(0, Math.min(max, n + (follow ? -step : step))));
  }, {isActive: active});
  const top = follow ? Math.max(0, max - scroll) : Math.max(0, scroll);
  return jsx(Box, {ref: outer, flexDirection:'column', flexGrow:1, flexBasis:0, minHeight:1, overflow:'hidden',
    children:jsx(Box, {ref:inner, flexDirection:'column', flexShrink:0, marginTop:-top, children})});
}
