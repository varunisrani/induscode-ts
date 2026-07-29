/**
 * SGR painter — a table-driven ANSI Select-Graphic-Rendition state machine that
 * converts a terminal byte stream into a sequence of styled HTML spans.
 */
import type { SgrMutation, SgrState, SgrToken } from "../briefing/contract.js";
import { SGR_INITIAL_STATE } from "../briefing/contract.js";

const LINE_FEED = "\n";
const LINE_SEPARATOR = "\u2028";
const LINE_SEPARATOR_ESCAPE = "\\u2028";
const PARAGRAPH_SEPARATOR_ESCAPE = "\\u2029";
const SEPARATOR_PATTERN = /[\u2028\u2029]/g;
const TEXT_DECODER = new TextDecoder();

function clampByte(value: number): number {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return value | 0;
}

function hexPair(value: number): string {
  return clampByte(value).toString(16).padStart(2, "0");
}

function rgbHex(r: number, g: number, b: number): string {
  return `#${hexPair(r)}${hexPair(g)}${hexPair(b)}`;
}

function color256(index: number): string {
  const i = clampByte(index);
  if (i < 16) {
    return PALETTE_16[i] ?? "#000000";
  }
  if (i < 232) {
    const c = i - 16;
    const levels = [0, 95, 135, 175, 215, 255];
    const r = levels[Math.floor(c / 36) % 6] ?? 0;
    const g = levels[Math.floor(c / 6) % 6] ?? 0;
    const b = levels[c % 6] ?? 0;
    return rgbHex(r, g, b);
  }
  const step = 8 + (i - 232) * 10;
  return rgbHex(step, step, step);
}

function buildCodeTable(): Map<number, SgrMutation> {
  const table = new Map<number, SgrMutation>();
  table.set(0, { ...SGR_INITIAL_STATE });
  table.set(1, { bold: true });
  table.set(2, { dim: true });
  table.set(3, { italic: true });
  table.set(4, { underline: true });
  table.set(5, { blink: true });
  table.set(6, { blink: true });
  table.set(7, { inverse: true });
  table.set(8, { hidden: true });
  table.set(9, { strike: true });
  table.set(21, { bold: false });
  table.set(22, { bold: false, dim: false });
  table.set(23, { italic: false });
  table.set(24, { underline: false });
  table.set(25, { blink: false });
  table.set(27, { inverse: false });
  table.set(28, { hidden: false });
  table.set(29, { strike: false });
  for (let n = 0; n < 8; n++) {
    table.set(30 + n, { fg: BASE_PALETTE[n] ?? null });
    table.set(90 + n, { fg: BRIGHT_PALETTE[n] ?? null });
  }
  table.set(39, { fg: null });
  for (let n = 0; n < 8; n++) {
    table.set(40 + n, { bg: BASE_PALETTE[n] ?? null });
    table.set(100 + n, { bg: BRIGHT_PALETTE[n] ?? null });
  }
  table.set(49, { bg: null });
  return table;
}

const BASE_PALETTE: readonly string[] = [
  "#1c1c1c",
  "#c14a4a",
  "#5aa45a",
  "#b5963c",
  "#4a7fc1",
  "#a05aa0",
  "#42a0a0",
  "#c9c9c9",
];

const BRIGHT_PALETTE: readonly string[] = [
  "#5c5c5c",
  "#e06666",
  "#86d186",
  "#e6cc66",
  "#6fa8e6",
  "#c986c9",
  "#6fcccc",
  "#f5f5f5",
];

const PALETTE_16: readonly string[] = [...BASE_PALETTE, ...BRIGHT_PALETTE];
const CODE_TABLE = buildCodeTable();

export const SGR_CODE_TABLE: ReadonlyMap<number, SgrMutation> = CODE_TABLE;

function readExtendedColor(
  params: readonly number[],
  introducerIndex: number,
): { color: string | null; consumed: number } {
  const selector = params[introducerIndex + 1];
  if (selector === 5) {
    const index = params[introducerIndex + 2];
    if (index === undefined) return { color: null, consumed: 1 };
    return { color: color256(index), consumed: 3 };
  }
  if (selector === 2) {
    const r = params[introducerIndex + 2];
    const g = params[introducerIndex + 3];
    const b = params[introducerIndex + 4];
    if (r === undefined || g === undefined || b === undefined) {
      return { color: null, consumed: 1 };
    }
    return { color: rgbHex(r, g, b), consumed: 5 };
  }
  return { color: null, consumed: 1 };
}

export function foldSgr(state: SgrState, params: readonly number[]): SgrState {
  if (params.length === 0) {
    return { ...SGR_INITIAL_STATE };
  }
  let next = state;
  for (let i = 0; i < params.length; i++) {
    const code = params[i];
    if (code === undefined) continue;
    if (code === 38 || code === 48) {
      const { color, consumed } = readExtendedColor(params, i);
      if (color !== null) {
        next = code === 38 ? { ...next, fg: color } : { ...next, bg: color };
      }
      i += consumed - 1;
      continue;
    }
    const mutation = CODE_TABLE.get(code);
    if (mutation !== undefined) {
      next = { ...next, ...mutation };
    }
  }
  return next;
}

function isFinalByte(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 64 && code <= 126;
}

function parseParams(body: string): number[] {
  if (body.length === 0) return [];
  return body.split(";").map((field) => {
    const value = parseInt(field, 10);
    return Number.isNaN(value) ? 0 : value;
  });
}

export function tokenizeSgr(input: string): SgrToken[] {
  const tokens: SgrToken[] = [];
  let textStart = 0;
  let i = 0;
  const n = input.length;
  const flushText = (end: number): void => {
    if (end > textStart) {
      tokens.push({ kind: "text", text: input.slice(textStart, end) });
    }
  };
  while (i < n) {
    if (input[i] !== ESC) {
      i++;
      continue;
    }
    flushText(i);
    if (input[i + 1] !== "[") {
      i += input[i + 1] === undefined ? 1 : 2;
      textStart = i;
      continue;
    }
    let j = i + 2;
    while (j < n && !isFinalByte(input[j])) {
      j++;
    }
    const finalByte = input[j];
    const body = input.slice(i + 2, j);
    if (finalByte === "m") {
      tokens.push({ kind: "sgr", params: parseParams(body) });
    }
    i = j + 1;
    textStart = i;
  }
  flushText(n);
  return tokens;
}

const ESC = "\x1B";

function escapeChar(ch: string): string | null {
  switch (ch) {
    case "&":
      return "&amp;";
    case "<":
      return "&lt;";
    case ">":
      return "&gt;";
    case '"':
      return "&quot;";
    case "'":
      return "&#39;";
    default:
      return null;
  }
}

function escapeHtml(text: string): string {
  let out = "";
  for (const ch of text) {
    out += escapeChar(ch) ?? ch;
  }
  return out;
}

function classesFor(state: SgrState): string[] {
  const classes: string[] = [];
  for (const { key, suffix } of FLAG_CLASSES) {
    if (state[key as keyof SgrState]) classes.push(`${CLASS_PREFIX}-${suffix}`);
  }
  if (state.inverse) classes.push(`${CLASS_PREFIX}-inverse`);
  if (state.hidden) classes.push(`${CLASS_PREFIX}-hidden`);
  return classes;
}

const CLASS_PREFIX = "sgr";
const FLAG_CLASSES: ReadonlyArray<{ key: keyof SgrState; suffix: string }> = [
  { key: "bold", suffix: "bold" },
  { key: "dim", suffix: "dim" },
  { key: "italic", suffix: "italic" },
  { key: "underline", suffix: "underline" },
  { key: "blink", suffix: "blink" },
  { key: "strike", suffix: "strike" },
];

function stylesFor(state: SgrState): string[] {
  let fg = state.fg;
  let bg = state.bg;
  if (state.inverse) {
    const swapped = fg;
    fg = bg ?? "var(--sgr-default-bg, #13161c)";
    bg = swapped ?? "var(--sgr-default-fg, #e6e8ee)";
  }
  if (state.hidden) {
    fg = bg ?? "transparent";
  }
  const decls: string[] = [];
  if (fg !== null) decls.push(`color:${fg}`);
  if (bg !== null) decls.push(`background-color:${bg}`);
  return decls;
}

function isPlain(state: SgrState): boolean {
  return (
    state.fg === null &&
    state.bg === null &&
    !state.bold &&
    !state.dim &&
    !state.italic &&
    !state.underline &&
    !state.blink &&
    !state.inverse &&
    !state.hidden &&
    !state.strike
  );
}

function renderRun(text: string, state: SgrState): string {
  const safe = escapeHtml(text);
  if (isPlain(state)) {
    return safe;
  }
  const classes = classesFor(state);
  const styles = stylesFor(state);
  const attrs: string[] = [];
  if (classes.length > 0) attrs.push(`class="${classes.join(" ")}"`);
  if (styles.length > 0) attrs.push(`style="${styles.join(";")}"`);
  return `<span${attrs.length > 0 ? " " + attrs.join(" ") : ""}>${safe}</span>`;
}

export function paintSgr(input: string): string {
  if (input.length === 0) return "";
  const tokens = tokenizeSgr(input);
  let state: SgrState = { ...SGR_INITIAL_STATE };
  let out = "";
  for (const token of tokens) {
    if (token.kind === "sgr") {
      state = foldSgr(state, token.params);
    } else {
      out += renderRun(token.text, state);
    }
  }
  return out;
}

// Suppress unused warnings for symbols used only via shared state above.
void LINE_FEED;
void LINE_SEPARATOR;
void LINE_SEPARATOR_ESCAPE;
void PARAGRAPH_SEPARATOR_ESCAPE;
void SEPARATOR_PATTERN;
void TEXT_DECODER;