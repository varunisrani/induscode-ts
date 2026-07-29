import vm from "node:vm";

export interface WorkflowMetaPhase {
  title: string;
  detail?: string;
  model?: string;
}

export interface WorkflowMeta {
  name: string;
  description: string;
  whenToUse?: string;
  phases?: WorkflowMetaPhase[];
}

export interface ParsedWorkflow {
  meta: WorkflowMeta;
  body: string;
}

export const NONDETERMINISM_ERROR =
  "Workflow scripts must be deterministic: Date.now()/Math.random()/new Date() are unavailable";

export const NONDETERMINISTIC_PATTERNS = [
  /\bDate\s*\.\s*now\s*\(/,
  /\bMath\s*\.\s*random\s*\(/,
  /\bnew\s+Date\b/,
];

export function parseWorkflowScript(script: string): ParsedWorkflow {
  if (typeof script !== "string") throw new TypeError("workflow script must be a string");
  assertDeterministicSource(script);
  const located = locateMetaExport(script);
  const meta = evaluateMetaLiteral(located.literal);
  validateMeta(meta);
  return { meta, body: script.slice(0, located.start) + script.slice(located.end) };
}

export function assertDeterministicSource(script: string): void {
  for (const pattern of NONDETERMINISTIC_PATTERNS) {
    if (pattern.test(script)) throw new Error(NONDETERMINISM_ERROR);
  }
}

export function locateMetaExport(script: string): { start: number; end: number; literal: string } {
  const firstToken = skipTrivia(script, 0);
  const header = /export\s+const\s+meta\s*=\s*/y;
  header.lastIndex = firstToken;
  const match = header.exec(script);
  if (!match || match.index !== firstToken) {
    throw new Error("`export const meta = { name, description }` must be the first statement in the script");
  }
  const braceStart = header.lastIndex;
  if (script[braceStart] !== "{") {
    throw new Error("meta export must be assigned a plain object literal: `export const meta = { … }`");
  }
  const braceEnd = matchBraces(script, braceStart);
  const literal = script.slice(braceStart, braceEnd);
  let end = braceEnd;
  const afterBrace = skipTrivia(script, braceEnd);
  if (script[afterBrace] === ";") end = afterBrace + 1;
  return { start: firstToken, end, literal };
}

export function skipTrivia(source: string, from: number): number {
  let i = from;
  while (i < source.length) {
    const ch = source[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f" || ch === "\v") {
      i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    break;
  }
  return i;
}

export function matchBraces(source: string, open: number): number {
  let depth = 0;
  let i = open;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipStringLike(source, i, ch);
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  throw new Error("meta object literal is not closed: missing `}`");
}

export function skipStringLike(source: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (quote === "`" && ch === "$" && source[i + 1] === "{") {
      let depth = 1;
      i += 2;
      while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") depth--;
        i++;
      }
      continue;
    }
    if (ch === quote) return i + 1;
    i++;
  }
  throw new Error("unterminated string in meta object literal");
}

export function evaluateMetaLiteral(literal: string): unknown {
  const context = vm.createContext(Object.create(null));
  try {
    return new vm.Script(`(${literal})`, { filename: "workflow.meta.js" }).runInContext(context, { timeout: 1000 });
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`meta export must be a plain object literal${detail}`);
  }
}

export function validateMeta(meta: unknown): asserts meta is WorkflowMeta {
  if (!meta || typeof meta !== "object") throw new Error("meta must be an object");
  const value = meta as Record<string, unknown>;
  if (typeof value.name !== "string" || !value.name.trim()) throw new Error("meta.name must be a non-empty string");
  if (typeof value.description !== "string" || !value.description.trim()) {
    throw new Error("meta.description must be a non-empty string");
  }
  if (value.whenToUse !== undefined && typeof value.whenToUse !== "string") throw new Error("meta.whenToUse must be a string");
  if (value.phases !== undefined) {
    if (!Array.isArray(value.phases)) throw new Error("meta.phases must be an array");
    for (const phase of value.phases) {
      if (!phase || typeof phase !== "object" || typeof phase.title !== "string") {
        throw new Error("each meta phase must have a title string");
      }
      if (phase.detail !== undefined && typeof phase.detail !== "string") {
        throw new Error("meta phase detail must be a string");
      }
    }
  }
}
