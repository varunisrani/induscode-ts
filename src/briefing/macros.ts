import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { briefingFault } from "./contract.js";
import type { Macro, MacroOrigin, MacroScope, MacroToken } from "./contract.js";

export interface LoadMacrosOptions { readonly origin?: MacroOrigin; readonly label?: string; }
export interface FrontmatterSplit { readonly frontmatter: Record<string, unknown>; readonly body: string; }

const decimal = (ch: string): boolean => ch.charCodeAt(0) >= 48 && ch.charCodeAt(0) <= 57;
const bareword = (ch: string): boolean => { const c = ch.charCodeAt(0); return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95; };
export const LEGACY_ALL_BAREWORD = ["A", "R", "G", "U", "M", "E", "N", "T", "S"].join("");
export const DERIVED_DESCRIPTION_BUDGET = 72;
let legacyReporter: ((kind: string, source: string) => void) | undefined;

export function setLegacyMacroReporter(fn: ((kind: string, source: string) => void) | undefined): void { legacyReporter = fn; }
export function reportLegacyUsage(kind: string, source: string): void { legacyReporter?.(kind, source); }
export function readNumber(text: string, i: number): { value: number; next: number } { let j = i; while (j < text.length && decimal(text[j])) j++; return { value: Number.parseInt(text.slice(i, j), 10), next: j }; }
export function readBareword(text: string, i: number): number { let j = i; while (j < text.length && bareword(text[j])) j++; return j; }
export function skipInlineSpace(text: string, i: number): number { let j = i; while (j < text.length && (text[j] === " " || text[j] === "\t")) j++; return j; }

type Scan = { token: MacroToken; next: number };
type LegacyScan = { token: MacroToken | null; literal?: string; next: number };

export function scanMacroBody(body: string): MacroToken[] {
  const tokens: MacroToken[] = []; let literal = ""; let i = 0;
  const flush = (): void => { if (literal) { tokens.push({ kind: "literal", text: literal }); literal = ""; } };
  while (i < body.length) {
    const ch = body[i];
    if (ch === "{" && body[i + 1] === "{") {
      if (body[i + 2] === "{" && body[i + 3] === "{") { literal += "{{"; i += 4; continue; }
      const parsed = scanIndusForm(body, i);
      if (parsed) { flush(); tokens.push(parsed.token); i = parsed.next; continue; }
    } else if (ch === "$") {
      const parsed = scanLegacyForm(body, i);
      if (parsed) { flush(); if (parsed.token) tokens.push(parsed.token); else literal += parsed.literal ?? ""; i = parsed.next; continue; }
    }
    literal += ch; i++;
  }
  flush(); return tokens;
}

export function scanIndusForm(text: string, start: number): Scan | null {
  let i = skipInlineSpace(text, start + 2); if (text.slice(i, i + 4) !== "arg.") return null; i += 4;
  const end = readBareword(text, i); const accessor = text.slice(i, end); i = end;
  if (!accessor && decimal(text[i] ?? "")) { const num = readNumber(text, i); i = skipInlineSpace(text, num.next); return text[i] === "}" && text[i + 1] === "}" && num.value >= 1 ? { token: { kind: "positional", index: num.value }, next: i + 2 } : null; }
  if (accessor === "all") { i = skipInlineSpace(text, i); return text[i] === "}" && text[i + 1] === "}" ? { token: { kind: "all" }, next: i + 2 } : null; }
  if (accessor === "slice") {
    i = skipInlineSpace(text, i); if (!decimal(text[i] ?? "")) return null; const startNum = readNumber(text, i); i = skipInlineSpace(text, startNum.next); let length: number | undefined;
    if (decimal(text[i] ?? "")) { const len = readNumber(text, i); length = len.value; i = skipInlineSpace(text, len.next); }
    if (text[i] !== "}" || text[i + 1] !== "}") return null;
    return { token: length === undefined ? { kind: "slice", start: startNum.value } : { kind: "slice", start: startNum.value, length }, next: i + 2 };
  }
  if (accessor === "rest") { i = skipInlineSpace(text, i); let value = 2; if (decimal(text[i] ?? "")) { const num = readNumber(text, i); value = num.value; i = skipInlineSpace(text, num.next); } return text[i] === "}" && text[i + 1] === "}" ? { token: { kind: "slice", start: value }, next: i + 2 } : null; }
  return null;
}

export function scanLegacyForm(text: string, start: number): LegacyScan | null {
  const next = text[start + 1];
  if (next === "$") return { token: null, literal: "$", next: start + 2 };
  if (next && decimal(next)) { const num = readNumber(text, start + 1); if (num.value < 1) return null; reportLegacyUsage("positional", text.slice(start, num.next)); return { token: { kind: "positional", index: num.value }, next: num.next }; }
  if (next === "@") { reportLegacyUsage("all", text.slice(start, start + 2)); return { token: { kind: "all" }, next: start + 2 }; }
  if (next === "{") return scanLegacyBraceForm(text, start);
  if (next && bareword(next)) { const end = readBareword(text, start + 1); if (text.slice(start + 1, end) === LEGACY_ALL_BAREWORD) { reportLegacyUsage("all", text.slice(start, end)); return { token: { kind: "all" }, next: end }; } }
  return null;
}

export function scanLegacyBraceForm(text: string, start: number): LegacyScan | null {
  let i = start + 2; if (text[i++] !== "@") return null;
  if (text[i] === "}") { reportLegacyUsage("all", text.slice(start, i + 1)); return { token: { kind: "all" }, next: i + 1 }; }
  if (text[i++] !== ":" || !decimal(text[i] ?? "")) return null; const startNum = readNumber(text, i); i = startNum.next; let length: number | undefined;
  if (text[i] === ":") { i++; if (!decimal(text[i] ?? "")) return null; const len = readNumber(text, i); length = len.value; i = len.next; }
  if (text[i] !== "}") return null; reportLegacyUsage("slice", text.slice(start, i + 1));
  return { token: length === undefined ? { kind: "slice", start: startNum.value } : { kind: "slice", start: startNum.value, length }, next: i + 1 };
}

export function splitArguments(raw: string): string[] {
  const out: string[] = []; let current = ""; let inWord = false; let quote: string | null = null;
  for (const ch of raw) { if (quote) { if (ch === quote) quote = null; else current += ch; inWord = true; } else if (ch === '"' || ch === "'") { quote = ch; inWord = true; } else if (/\s/.test(ch)) { if (inWord) { out.push(current); current = ""; inWord = false; } } else { current += ch; inWord = true; } }
  if (inWord) out.push(current); return out;
}
export function buildMacroScope(raw: string): MacroScope { const args = splitArguments(raw); return { args, all: args.join(" "), raw }; }
export function resolveTokens(tokens: readonly MacroToken[], scope: MacroScope): string { return tokens.map((token) => { if (token.kind === "literal") return token.text; if (token.kind === "positional") return scope.args[token.index - 1] ?? ""; if (token.kind === "all") return scope.all; const from = Math.max(0, token.start - 1); return (token.length === undefined ? scope.args.slice(from) : scope.args.slice(from, from + Math.max(0, token.length))).join(" "); }).join(""); }
export function applyMacros(body: string, raw: string): string { return resolveTokens(scanMacroBody(body), buildMacroScope(raw)); }
export function firstSpaceIndex(value: string): number { for (let i = 0; i < value.length; i++) if (/\s/.test(value[i])) return i; return -1; }
export function expandInvocation(line: string, macros: readonly Macro[]): string { if (!line.startsWith("/")) return line; const sliced = line.slice(1); const space = firstSpaceIndex(sliced); const name = space < 0 ? sliced : sliced.slice(0, space); const macro = macros.find((item) => item.name === name); return macro ? applyMacros(macro.body, space < 0 ? "" : sliced.slice(space + 1)) : line; }

export function loadMacros(dir: string, opts: LoadMacrosOptions = {}): Macro[] {
  const origin = opts.origin ?? "path"; const label = opts.label ?? origin; let entries: string[];
  try { entries = readdirSync(dir); } catch { return []; }
  const seen = new Set<string>(); const macros: Macro[] = [];
  for (const entry of entries.sort()) { if (entry.startsWith(".") || !entry.toLowerCase().endsWith(".md")) continue; const path = join(dir, entry); try { if (!statSync(path).isFile()) continue; } catch { continue; } const macro = readMacroFile(path, origin, label); if (!seen.has(macro.name)) { seen.add(macro.name); macros.push(macro); } }
  return macros;
}
export function readMacroFile(path: string, origin: MacroOrigin, label: string): Macro { let text: string; try { text = readFileSync(path, "utf8"); } catch (cause) { throw briefingFault("macro_invalid", `could not read macro file at ${path}`, cause); } const { frontmatter, body } = splitFrontmatter(text); const name = basename(path).replace(/\.md$/i, ""); const declared = typeof frontmatter.description === "string" ? frontmatter.description.trim() : ""; return { name, description: declared ? `${declared} (${label})` : deriveDescription(body, label), body, origin, source: path }; }
export function deriveDescription(body: string, label: string): string { const first = body.split("\n").find((line) => line.trim())?.trim() ?? ""; const trimmed = first.length > DERIVED_DESCRIPTION_BUDGET ? `${first.slice(0, DERIVED_DESCRIPTION_BUDGET).trimEnd()}…` : first; return `${trimmed || "custom macro"} (${label})`; }
export function splitFrontmatter(text: string): FrontmatterSplit { const lines = text.split("\n"); if (lines[0]?.trim() !== "---") return { frontmatter: {}, body: text }; const close = lines.findIndex((line, i) => i > 0 && line.trim() === "---"); if (close < 0) return { frontmatter: {}, body: text }; const frontmatter: Record<string, unknown> = {}; for (const line of lines.slice(1, close)) { if (!line.trim() || line.trimStart().startsWith("#")) continue; const colon = line.indexOf(":"); if (colon > 0) frontmatter[line.slice(0, colon).trim()] = unquoteScalar(line.slice(colon + 1).trim()); } return { frontmatter, body: lines.slice(close + 1).join("\n").replace(/^\n+/, "") }; }
export function unquoteScalar(value: string): string { if (value.length >= 2 && ((value[0] === '"' && value.at(-1) === '"') || (value[0] === "'" && value.at(-1) === "'"))) return value.slice(1, -1); return value; }
