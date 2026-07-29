/**
 * Slash line resolution — parse a typed line, then match it against the registry.
 */
import type { SlashCommand, SlashRegistry } from "../contract.js";

/**
 * The leading character that marks a line as a slash invocation.
 */
export const SLASH_PREFIX = "/" as const;

const COMMAND_TOKEN = /^[a-zA-Z][a-zA-Z0-9:-]*(?:\s|$)/;

/**
 * The lexical split of a slash line into its command token and argument tail.
 */
export interface SlashLine {
  readonly name: string;
  readonly args: string;
}

/**
 * Whether a typed line is shaped like a slash command at all.
 */
export function looksLikeSlash(input: string): boolean {
  const trimmed = input.trimStart();
  if (!trimmed.startsWith(SLASH_PREFIX)) return false;
  return COMMAND_TOKEN.test(trimmed.slice(SLASH_PREFIX.length));
}

/**
 * Split a slash line into its {@link SlashLine} token/argument pair.
 */
export function parseSlash(input: string): SlashLine | undefined {
  if (!looksLikeSlash(input)) return void 0;
  const body = input.trimStart().slice(SLASH_PREFIX.length);
  const gap = body.search(/\s/);
  if (gap === -1) {
    return { name: body.toLowerCase(), args: "" };
  }
  return {
    name: body.slice(0, gap).toLowerCase(),
    args: body.slice(gap + 1).trim()
  };
}

/**
 * The outcome of resolving a typed line against a {@link SlashRegistry}.
 */
export type SlashResolution =
  | { readonly kind: "not-slash" }
  | { readonly kind: "match"; readonly command: SlashCommand; readonly args: string }
  | { readonly kind: "miss"; readonly name: string };

/**
 * Resolve a raw composer line against the registry to a {@link SlashResolution}.
 */
export function resolveSlash(input: string, registry: SlashRegistry): SlashResolution {
  const line = parseSlash(input);
  if (line === void 0) return { kind: "not-slash" };
  const command = registry.index.get(line.name);
  if (command === void 0) return { kind: "miss", name: line.name };
  return { kind: "match", command, args: line.args };
}