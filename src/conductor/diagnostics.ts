import * as path from "node:path";
import { existsSync } from "node:fs";

export type DiagnosticSeverity = "Error" | "Warning" | "Info" | "Hint";
export interface Position { readonly line: number; readonly character: number }
export interface Diagnostic {
  readonly message: string;
  readonly severity: DiagnosticSeverity;
  readonly range: { readonly start: Position; readonly end: Position };
  readonly source?: string;
  readonly code?: string | number;
}
export interface DiagnosticFile { readonly uri: string; readonly diagnostics: Diagnostic[] }
export interface DedupOptions { readonly maxPerFile?: number; readonly maxTotal?: number }
export type DiagnosticRunner = (cwd: string, signal?: AbortSignal) => Promise<DiagnosticFile[]>;
export interface DiagnosticsConfig {
  readonly enabled?: boolean;
  readonly runners?: DiagnosticRunner[];
  readonly timeoutMs?: number;
  readonly maxPerFile?: number;
  readonly maxTotal?: number;
}

export const MAX_PER_FILE = 10;
export const MAX_TOTAL = 30;
export const MAX_SUMMARY_CHARS = 4000;
const DELIVERED_KEYS_CAP = 500;
const DEFAULT_TIMEOUT_MS = 30000;
const SEVERITY_RANK: Record<DiagnosticSeverity, number> = { Error: 0, Warning: 1, Info: 2, Hint: 3 };
const TS_JS_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);

export function createDiagnosticKey(diagnostic: Diagnostic): string {
  const { start, end } = diagnostic.range;
  return `${start.line}:${start.character}:${end.line}:${end.character}:${diagnostic.severity}:${diagnostic.code ?? ""}:${diagnostic.message.trim()}`;
}
export function areDiagnosticsEqual(a: Diagnostic, b: Diagnostic): boolean { return createDiagnosticKey(a) === createDiagnosticKey(b); }
function compareDiagnostics(a: Diagnostic, b: Diagnostic): number {
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    || a.range.start.line - b.range.start.line
    || a.range.start.character - b.range.start.character;
}
function recordDelivered(delivered: Map<string, Set<string>>, uri: string, key: string): void {
  let set = delivered.get(uri);
  if (!set) { set = new Set(); delivered.set(uri, set); }
  if (set.has(key)) return;
  if (set.size >= DELIVERED_KEYS_CAP) {
    const oldest = set.values().next().value;
    if (oldest !== undefined) set.delete(oldest);
  }
  set.add(key);
}

export function deduplicateAndCap(files: readonly DiagnosticFile[], delivered: Map<string, Set<string>>, opts: DedupOptions = {}): DiagnosticFile[] {
  const candidates: { uri: string; diagnostic: Diagnostic; key: string }[] = [];
  for (const file of files) {
    const prior = delivered.get(file.uri) ?? new Set<string>();
    const seen = new Set<string>();
    const kept = file.diagnostics.filter((diagnostic) => {
      const key = createDiagnosticKey(diagnostic);
      if (prior.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort(compareDiagnostics).slice(0, opts.maxPerFile ?? MAX_PER_FILE);
    for (const diagnostic of kept) candidates.push({ uri: file.uri, diagnostic, key: createDiagnosticKey(diagnostic) });
  }
  candidates.sort((a, b) => compareDiagnostics(a.diagnostic, b.diagnostic));
  const grouped = new Map<string, Diagnostic[]>();
  for (const candidate of candidates.slice(0, opts.maxTotal ?? MAX_TOTAL)) {
    const bucket = grouped.get(candidate.uri) ?? [];
    bucket.push(candidate.diagnostic);
    grouped.set(candidate.uri, bucket);
    recordDelivered(delivered, candidate.uri, candidate.key);
  }
  return [...grouped].map(([uri, diagnostics]) => ({ uri, diagnostics: diagnostics.sort(compareDiagnostics) }));
}

export function getSeveritySymbol(severity: DiagnosticSeverity): string {
  return severity === "Error" ? "x" : severity === "Warning" ? "!" : severity === "Info" ? "i" : "*";
}
export function formatDiagnosticsSummary(files: readonly DiagnosticFile[], maxChars = MAX_SUMMARY_CHARS): string {
  const lines: string[] = [];
  for (const file of files) {
    lines.push(file.uri);
    for (const diagnostic of file.diagnostics) {
      const code = diagnostic.code !== undefined && diagnostic.code !== "" ? ` ${diagnostic.code}` : "";
      lines.push(`  ${getSeveritySymbol(diagnostic.severity)} [${diagnostic.severity}]${code} (${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}) ${diagnostic.message.trim()}`);
    }
  }
  const text = lines.join("\n");
  return text.length <= maxChars ? text : text.slice(0, maxChars - 1) + "…";
}

async function loadSpawn() {
  try { return (await import("node:child_process")).spawn; } catch { return undefined; }
}
function captureOutput(spawn: any, bin: string, args: string[], cwd: string, signal?: AbortSignal): Promise<string | undefined> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value?: string) => { if (!settled) { settled = true; resolve(value); } };
    let child: any;
    try { child = spawn(bin, args, { cwd, shell: false }); } catch { finish(); return; }
    let buffer = "";
    const abort = () => { try { child.kill(); } catch {} finish(); };
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    child.stdout?.on("data", (chunk: unknown) => { buffer += String(chunk); });
    child.stderr?.on("data", (chunk: unknown) => { buffer += String(chunk); });
    child.on("error", () => finish());
    child.on("close", () => finish(buffer));
  });
}

export async function runTscDiagnostics(cwd: string, signal?: AbortSignal): Promise<DiagnosticFile[]> {
  const spawn = await loadSpawn();
  if (!spawn || signal?.aborted) return [];
  const output = await captureOutput(spawn, path.join(cwd, "node_modules", ".bin", "tsc"), ["--noEmit", "--pretty", "false"], cwd, signal);
  return output === undefined ? [] : parseTscOutput(output, cwd);
}
export function parseTscOutput(output: string, cwd: string): DiagnosticFile[] {
  const regexp = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.*)$/;
  const grouped = new Map<string, Diagnostic[]>();
  for (const raw of output.split(/\r?\n/)) {
    const match = regexp.exec(raw);
    if (!match) continue;
    const [, file, lineText, columnText, severity, code, message] = match;
    const uri = path.isAbsolute(file) ? file : path.resolve(cwd, file);
    const line = Math.max(0, Number(lineText) - 1);
    const character = Math.max(0, Number(columnText) - 1);
    const diagnostic: Diagnostic = { message, severity: severity === "warning" ? "Warning" : "Error", range: { start: { line, character }, end: { line, character } }, source: "tsc", code };
    grouped.set(uri, [...(grouped.get(uri) ?? []), diagnostic]);
  }
  return [...grouped].map(([uri, diagnostics]) => ({ uri, diagnostics }));
}

export async function runEslintDiagnostics(files: readonly string[], cwd: string, signal?: AbortSignal): Promise<DiagnosticFile[]> {
  if (files.length === 0) return [];
  const spawn = await loadSpawn();
  if (!spawn || signal?.aborted) return [];
  const output = await captureOutput(spawn, path.join(cwd, "node_modules", ".bin", "eslint"), ["--format", "json", ...files], cwd, signal);
  return output === undefined ? [] : parseEslintOutput(output, cwd);
}
export function parseEslintOutput(output: string, cwd: string): DiagnosticFile[] {
  const start = output.indexOf("[");
  const end = output.lastIndexOf("]");
  if (start < 0 || end < start) return [];
  let parsed: any[];
  try { parsed = JSON.parse(output.slice(start, end + 1)); } catch { return []; }
  const result: DiagnosticFile[] = [];
  for (const file of parsed) {
    if (!Array.isArray(file.messages) || file.messages.length === 0) continue;
    const uri = path.isAbsolute(file.filePath) ? file.filePath : path.resolve(cwd, file.filePath);
    const diagnostics = file.messages.map((message: any): Diagnostic => ({
      message: message.message,
      severity: message.severity === 2 ? "Error" : "Warning",
      range: {
        start: { line: Math.max(0, (message.line ?? 1) - 1), character: Math.max(0, (message.column ?? 1) - 1) },
        end: { line: Math.max(0, (message.endLine ?? message.line ?? 1) - 1), character: Math.max(0, (message.endColumn ?? message.column ?? 1) - 1) },
      },
      source: "eslint",
      ...(message.ruleId ? { code: message.ruleId } : {}),
    }));
    result.push({ uri, diagnostics });
  }
  return result;
}

export class DiagnosticsEngine {
  readonly #cwd: string;
  readonly #enabled: boolean;
  readonly #runners: DiagnosticRunner[];
  readonly #timeoutMs: number;
  readonly #maxPerFile: number;
  readonly #maxTotal: number;
  readonly #delivered = new Map<string, Set<string>>();
  #baseline?: Map<string, Set<string>>;

  constructor(cwd: string, config: DiagnosticsConfig = {}) {
    this.#cwd = cwd;
    this.#enabled = config.enabled ?? true;
    this.#runners = config.runners ?? [runTscDiagnostics];
    this.#timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.#maxPerFile = config.maxPerFile ?? MAX_PER_FILE;
    this.#maxTotal = config.maxTotal ?? MAX_TOTAL;
  }
  get enabled(): boolean { return this.#enabled; }
  get hasBaseline(): boolean { return this.#baseline !== undefined; }
  async seedBaseline(signal?: AbortSignal): Promise<void> {
    if (!this.#enabled || this.#baseline !== undefined) return;
    let files: DiagnosticFile[] = [];
    try { files = await this.#runAll(signal); } catch {}
    this.#baseline = new Map(files.map((file) => [file.uri, new Set(file.diagnostics.map(createDiagnosticKey))]));
  }
  async newDiagnostics(editedPaths: readonly string[], signal?: AbortSignal): Promise<DiagnosticFile[]> {
    if (!this.#enabled || editedPaths.length === 0) return [];
    const all = await this.#runAll(signal);
    if (this.#baseline === undefined) {
      this.#baseline = new Map(all.map((file) => [file.uri, new Set(file.diagnostics.map(createDiagnosticKey))]));
      return [];
    }
    const edited = new Set(editedPaths.map((file) => path.resolve(this.#cwd, file)));
    const candidates = all.filter((file) => edited.has(file.uri)).map((file) => ({ uri: file.uri, diagnostics: file.diagnostics.filter((diagnostic) => !(this.#baseline?.get(file.uri) ?? new Set()).has(createDiagnosticKey(diagnostic))) })).filter((file) => file.diagnostics.length > 0);
    return deduplicateAndCap(candidates, this.#delivered, { maxPerFile: this.#maxPerFile, maxTotal: this.#maxTotal });
  }
  clearDeliveredForFile(uri: string): void { this.#delivered.delete(path.resolve(this.#cwd, uri)); }
  reset(): void { this.#delivered.clear(); this.#baseline = undefined; }
  async #runAll(signal?: AbortSignal): Promise<DiagnosticFile[]> {
    const merged = new Map<string, Diagnostic[]>();
    for (const runner of this.#runners) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.#timeoutMs);
      const abort = () => controller.abort();
      if (signal?.aborted) controller.abort(); else signal?.addEventListener("abort", abort, { once: true });
      let files: DiagnosticFile[] = [];
      try { files = await runner(this.#cwd, controller.signal); } catch {} finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
      for (const file of files) merged.set(file.uri, [...(merged.get(file.uri) ?? []), ...file.diagnostics]);
    }
    return [...merged].map(([uri, diagnostics]) => ({ uri, diagnostics }));
  }
}

export function isTypeScriptOrJs(filePath: string): boolean { return TS_JS_EXTENSIONS.has(path.extname(filePath).toLowerCase()); }
export function hasTsConfig(cwd: string): boolean { try { return existsSync(path.join(cwd, "tsconfig.json")); } catch { return false; } }
export function hasEslintConfig(cwd: string): boolean {
  try {
    return ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", ".eslintrc", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json", ".eslintrc.yml", ".eslintrc.yaml"].some((name) => existsSync(path.join(cwd, name)));
  } catch { return false; }
}
