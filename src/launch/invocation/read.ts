/**
 * The invocation reader — a generic, table-driven argv parser over
 * {@link FLAG_SPECS}.
 */
import {
  type FlagValue,
  type Invocation,
  isThinkingEffort,
  isToolName,
} from "../contract.js";
import { FLAG_SPECS, type GroupedFlagSpec } from "./flags.js";
import { isReasoningEffortSupported } from "../../models.js";

interface ParseState {
  flags: Record<string, FlagValue>;
  positionals: string[];
  prompt?: string;
  fileRefs: string[];
}

function isFlagToken(token: string): boolean {
  return token.length > 1 && token.startsWith("-");
}

function isLongToken(token: string): boolean {
  return token.startsWith("--");
}

function isShortCluster(token: string): boolean {
  return token.length > 1 && token[0] === "-" && token[1] !== "-";
}

function flagKey(name: string): string {
  return name.replace(/^-+/, "");
}

function buildTokenIndex(): Map<string, GroupedFlagSpec> {
  const index = new Map<string, GroupedFlagSpec>();
  for (const spec of FLAG_SPECS) {
    index.set(spec.name, spec);
    for (const alias of spec.aliases ?? []) {
      index.set(alias, spec);
    }
  }
  return index;
}

const TOKEN_INDEX = buildTokenIndex();

function buildShortBooleanSet(): Set<string> {
  const set = new Set<string>();
  for (const spec of FLAG_SPECS) {
    if (spec.kind !== "boolean") continue;
    for (const alias of spec.aliases ?? []) {
      if (alias.length === 2 && alias[0] === "-" && alias[1] !== "-") {
        set.add(alias[1]);
      }
    }
  }
  return set;
}

const SHORT_BOOLEANS = buildShortBooleanSet();

function splitInline(token: string): { name: string; inline?: string } {
  if (isLongToken(token)) {
    const eq = token.indexOf("=");
    if (eq !== -1) {
      return { name: token.slice(0, eq), inline: token.slice(eq + 1) };
    }
  }
  return { name: token };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function coerceScalar(kind: "string" | "number", raw: string): string | number {
  if (kind === "number") return Number(raw);
  return raw;
}

function pushPositional(state: ParseState, token: string): void {
  if (state.prompt === undefined) {
    state.prompt = token;
  } else {
    state.positionals.push(token);
  }
}

function accumulateList(state: ParseState, key: string, items: string[]): void {
  const prior = state.flags[key];
  const base = Array.isArray(prior) ? prior : [];
  state.flags[key] = [...base, ...items];
}

function applyFlag(
  spec: GroupedFlagSpec,
  inline: string | undefined,
  argv: readonly string[],
  i: number,
  state: ParseState,
): number {
  const key = flagKey(spec.name);
  if (spec.kind === "boolean") {
    state.flags[key] = true;
    return i;
  }
  let value: string | undefined = inline;
  let consumed = i;
  if (value === undefined) {
    const next = argv[i + 1];
    if (next !== undefined && !isFlagToken(next)) {
      value = next;
      consumed = i + 1;
    }
  }
  const raw = value ?? "";
  if (spec.kind === "list") {
    accumulateList(state, key, splitList(raw));
  } else {
    state.flags[key] = coerceScalar(spec.kind, raw);
  }
  return consumed;
}

function applyShortCluster(token: string, state: ParseState): boolean {
  const letters = token.slice(1).split("");
  if (!letters.every((letter) => SHORT_BOOLEANS.has(letter))) {
    return false;
  }
  for (const letter of letters) {
    const spec = TOKEN_INDEX.get(`-${letter}`);
    if (spec) state.flags[flagKey(spec.name)] = true;
  }
  return true;
}

function readString(flags: Record<string, FlagValue>, key: string): string | undefined {
  const value = flags[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readList(flags: Record<string, FlagValue>, key: string): string[] | undefined {
  const value = flags[key];
  return Array.isArray(value) ? value : undefined;
}

function readBool(flags: Record<string, FlagValue>, key: string): boolean {
  return flags[key] === true;
}

function deriveMode(flags: Record<string, FlagValue>): Invocation["mode"] {
  if (readBool(flags, "print") && !readBool(flags, "interactive")) return "json";
  if (readBool(flags, "json")) return "rpc";
  return "text";
}

function resolveThinking(flags: Record<string, FlagValue>, modelId: string | undefined): Invocation["thinking"] {
  const raw = readString(flags, "thinking");
  return raw !== undefined && isThinkingEffort(raw) && isReasoningEffortSupported(modelId, raw) ? raw : undefined;
}

function resolveTools(flags: Record<string, FlagValue>): Invocation["tools"] {
  const raw = readList(flags, "tools");
  if (raw === undefined) return undefined;
  return raw.filter((name): name is Invocation["tools"] extends Array<infer T> ? T : never =>
    isToolName(name),
  );
}

/**
 * Read a sliced `argv` into the fully-parsed {@link Invocation}.
 */
export function readInvocation(argv: readonly string[]): Invocation {
  const state: ParseState = { flags: {}, positionals: [], fileRefs: [] };
  let optionsTerminated = false;
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (optionsTerminated) {
      pushPositional(state, token);
      continue;
    }
    if (token === "--") {
      optionsTerminated = true;
      continue;
    }
    if (token.startsWith("@") && token.length > 1) {
      state.fileRefs.push(token.slice(1));
      continue;
    }
    if (!isFlagToken(token)) {
      pushPositional(state, token);
      continue;
    }
    const { name, inline } = splitInline(token);
    const spec = TOKEN_INDEX.get(name);
    if (spec) {
      i = applyFlag(spec, inline, argv, i, state);
      continue;
    }
    if (isShortCluster(token) && applyShortCluster(token, state)) {
      continue;
    }
    state.flags[flagKey(name)] = inline ?? true;
  }
  const { flags } = state;
  const mode = deriveMode(flags);
  const model = readString(flags, "model");
  const fallbackModel = readString(flags, "fallback-model");
  const account = readString(flags, "account");
  const cwd = readString(flags, "cwd");
  const system = readString(flags, "system");
  const appendSystem = readString(flags, "append-system");
  const thinking = resolveThinking(flags, model);
  const tools = resolveTools(flags);
  return {
    mode,
    ...(state.prompt !== undefined ? { prompt: state.prompt } : {}),
    flags,
    positionals: state.positionals,
    ...(model !== undefined ? { model } : {}),
    ...(fallbackModel !== undefined ? { fallbackModel } : {}),
    ...(account !== undefined ? { account } : {}),
    ...(cwd !== undefined ? { cwd } : {}),
    ...(system !== undefined ? { system } : {}),
    ...(appendSystem !== undefined ? { appendSystem } : {}),
    ...(thinking !== undefined ? { thinking } : {}),
    ...(tools !== undefined ? { tools } : {}),
    noTools: readBool(flags, "no-tools"),
    mcp: readList(flags, "mcp") ?? [],
    print: readBool(flags, "print"),
    interactive: readBool(flags, "interactive"),
    help: readBool(flags, "help"),
    version: readBool(flags, "version"),
  };
}

/**
 * The `@file` references collected from an argv, exposed for the attachment
 * gatherer.
 */
export function readFileReferences(argv: readonly string[]): string[] {
  const refs: string[] = [];
  let optionsTerminated = false;
  for (const token of argv) {
    if (optionsTerminated) continue;
    if (token === "--") {
      optionsTerminated = true;
      continue;
    }
    if (token.startsWith("@") && token.length > 1) {
      refs.push(token.slice(1));
    }
  }
  return refs;
}