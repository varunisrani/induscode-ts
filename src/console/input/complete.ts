/**
 * Completion source — structured suggestions for the composer's prompt line.
 */
import type { SlashRegistry } from "../contract.js";

export type CompletionKind = "slash" | "path" | "none";

export interface Suggestion {
  readonly value: string;
  readonly label: string;
  readonly detail: string;
  readonly isDir: boolean;
}

export interface TokenSpan {
  readonly start: number;
  readonly end: number;
}

export interface CompletionResult {
  readonly kind: CompletionKind;
  readonly span: TokenSpan;
  readonly suggestions: readonly Suggestion[];
}

export interface DirEntry {
  readonly name: string;
  readonly isDir: boolean;
}

export type DirReader = (dirPath: string) => readonly DirEntry[];

function noCompletion(caret: number): CompletionResult {
  return {
    kind: "none",
    span: { start: caret, end: caret },
    suggestions: []
  };
}

function isBoundary(ch: string) {
  return ch === " " || ch === "\t" || ch === "\n";
}

function activeToken(buffer: string, caret: number): { span: TokenSpan; stem: string } {
  let start = caret;
  while (start > 0 && !isBoundary(buffer[start - 1])) start--;
  let end = caret;
  while (end < buffer.length && !isBoundary(buffer[end])) end++;
  return { span: { start, end }, stem: buffer.slice(start, caret) };
}

function completeSlash(stem: string, registry: SlashRegistry): Suggestion[] {
  const needle = stem.slice(1).toLowerCase();
  const exact: Suggestion[] = [];
  const prefix: Suggestion[] = [];
  for (const cmd of registry.commands) {
    const names = [cmd.name, ...(cmd.aliases ?? [])];
    const hit = names.find((n) => n.toLowerCase().startsWith(needle));
    if (hit === void 0) continue;
    const value = cmd.takesArgs ? `/${cmd.name} ` : `/${cmd.name}`;
    const suggestion: Suggestion = {
      value,
      label: `/${cmd.name}`,
      detail: cmd.summary,
      isDir: false
    };
    if (hit.toLowerCase() === needle) exact.push(suggestion);
    else prefix.push(suggestion);
  }
  return [...exact, ...prefix];
}

function splitPathStem(stem: string) {
  const sigil = stem.startsWith("@") ? "@" : "";
  const body = stem.slice(sigil.length);
  const slash = body.lastIndexOf("/");
  if (slash < 0) return { dir: ".", leaf: body, sigil };
  return { dir: body.slice(0, slash) || "/", leaf: body.slice(slash + 1), sigil };
}

function completePath(stem: string, readDir: DirReader): Suggestion[] {
  const { dir, leaf, sigil } = splitPathStem(stem);
  const lowerLeaf = leaf.toLowerCase();
  const prefix = dir === "." ? "" : dir === "/" ? "/" : `${dir}/`;
  const matches = readDir(dir)
    .filter((e) => e.name.toLowerCase().startsWith(lowerLeaf))
    .sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
  return matches.map((e) => {
    const tail = e.isDir ? "/" : "";
    return {
      value: `${sigil}${prefix}${e.name}${tail}`,
      label: `${e.name}${tail}`,
      detail: e.isDir ? "directory" : "file",
      isDir: e.isDir
    };
  });
}

function looksLikePath(stem: string) {
  return stem.startsWith("@") || stem.includes("/");
}

/**
 * Compute the completion offering at a caret position.
 */
export function completeAt(buffer: string, caret: number, registry: SlashRegistry, readDir: DirReader): CompletionResult {
  const { span, stem } = activeToken(buffer, caret);
  if (stem.startsWith("/") && span.start === 0) {
    return { kind: "slash", span, suggestions: completeSlash(stem, registry) };
  }
  if (looksLikePath(stem)) {
    return { kind: "path", span, suggestions: completePath(stem, readDir) };
  }
  return noCompletion(caret);
}

/**
 * Splice an accepted suggestion back into the buffer.
 */
export function applySuggestion(buffer: string, span: TokenSpan, suggestion: Suggestion): { buffer: string; caret: number } {
  const next = buffer.slice(0, span.start) + suggestion.value + buffer.slice(span.end);
  return { buffer: next, caret: span.start + suggestion.value.length };
}