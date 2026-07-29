/**
 * WorkingIndicator — the live "agent is working" affordance.
 */
import React, { useEffect, useState } from "indusagi/react-host";
import { Box, Text } from "indusagi/react-host/ink";
import { jsx, jsxs } from "indusagi/react-host/jsx-runtime";
import type { InkThemeAdapter } from "indusagi/react-ink";

const { useRef } = React;

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const FRAME_MS = 120;
const WORD_MS = 4000;

export const WORKING_WORDS = [
  "Cogitating",
  "Pondering",
  "Noodling",
  "Simmering",
  "Brewing",
  "Percolating",
  "Conjuring",
  "Tinkering",
  "Wrangling",
  "Synthesizing",
  "Computing",
  "Musing",
  "Scheming",
  "Hatching",
  "Whirring",
  "Crunching",
  "Spelunking",
  "Untangling",
  "Marinating",
  "Ruminating",
  "Architecting",
  "Finagling",
  "Concocting",
  "Deliberating",
  "Orchestrating",
  "Calibrating",
  "Channeling",
  "Vibing",
  "Forging",
  "Assembling"
] as const;

export function pickWord(index: number): string {
  const n = WORKING_WORDS.length;
  return WORKING_WORDS[(((index % n) + n) % n) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29];
}

export function phaseLabel(phase: string | undefined): string | null {
  switch (phase) {
    case "tooling":
      return "Running tools";
    case "condensing":
      return "Compacting context";
    default:
      return null;
  }
}

export interface WorkingIndicatorProps {
  readonly theme: InkThemeAdapter;
  readonly busy: boolean;
  readonly phase?: string;
}

export function WorkingIndicator({ theme, busy, phase }: WorkingIndicatorProps) {
  const [frame, setFrame] = useState(0);
  const startRef = useRef<number | null>(null);
  const wordOffsetRef = useRef(0);
  useEffect(() => {
    if (!busy) {
      startRef.current = null;
      return;
    }
    if (startRef.current === null) {
      startRef.current = Date.now();
      wordOffsetRef.current = Math.floor(Math.random() * WORKING_WORDS.length);
    }
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), FRAME_MS);
    return () => clearInterval(id);
  }, [busy]);
  if (!busy) return null;
  const elapsedMs = startRef.current !== null ? Date.now() - startRef.current : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const spinner = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
  const label = phaseLabel(phase) ?? pickWord(wordOffsetRef.current + Math.floor(elapsedMs / WORD_MS));
  return jsxs(Box, {
    marginTop: 1,
    children: [
      jsx(Text, { children: theme.color("accent", `${spinner} ${label}… `) }),
      jsx(Text, { children: theme.muted(`(${elapsedSec}s · esc to interrupt)`) })
    ]
  });
}