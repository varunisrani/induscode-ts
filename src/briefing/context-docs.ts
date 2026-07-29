import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, extname, isAbsolute, join, parse, resolve } from "node:path";
import type { ContextDoc } from "./contract.js";

export interface GatherContextDocsOptions { readonly maxImportDepth?: number; readonly maxBytesPerDoc?: number; }
export const DEFAULT_MAX_IMPORT_DEPTH = 5;
export const DEFAULT_MAX_BYTES_PER_DOC = 40_000;
export const CANDIDATE_FILES = ["AGENTS.md", "CLAUDE.md", "INDUSAGI.md", "CLAUDE.local.md", "AGENTS.local.md", join(".indusagi", "CLAUDE.md"), join(".claude", "CLAUDE.md")];
export const TEXT_FILE_EXTENSIONS = new Set([".md", ".markdown", ".txt", ".text", ".json", ".jsonc", ".yaml", ".yml", ".toml", ".xml", ".csv", ".html", ".htm", ".css", ".js", ".ts", ".tsx", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".py", ".rb", ".go", ".rs", ".sh", ".env"]);
export const IMPORT_REGEX = /(?:^|\s)@((?:[^\s\\]|\\ )+)/g;

export function shortenPath(path: string, cwd: string, home: string): string { if (cwd && path.startsWith(cwd)) { const rest = path.slice(cwd.length).replace(/^[/\\]+/, ""); return rest ? `./${rest}` : "."; } return home && path.startsWith(home) ? `~${path.slice(home.length)}` : path; }
export function dirChain(cwd: string): string[] { const chain: string[] = []; let current = cwd; for (let i = 0; i < 256; i++) { chain.push(current); const parent = dirname(current); if (parent === current || current === parse(current).root) break; current = parent; } return chain.reverse(); }
export function safeRealpath(path: string): string { try { return realpathSync(path); } catch { return path; } }
export function isTextFile(path: string): boolean { const extension = extname(path).toLowerCase(); return !extension || TEXT_FILE_EXTENSIONS.has(extension); }
export function readFileBody(path: string): string | null { if (!existsSync(path)) return null; try { const body = readFileSync(path, "utf8").trim(); return body || null; } catch { return null; } }
export function extractImports(body: string, baseDir: string, home: string): string[] { const out: string[] = []; IMPORT_REGEX.lastIndex = 0; let match: RegExpExecArray | null; while ((match = IMPORT_REGEX.exec(body))) { let spec = match[1]; if (!spec) continue; const hash = spec.indexOf("#"); if (hash >= 0) spec = spec.slice(0, hash); spec = spec.replace(/\\ /g, " ").trim(); if (!spec) continue; const absolute = spec.startsWith("~/") ? join(home, spec.slice(2)) : isAbsolute(spec) ? spec : resolve(baseDir, spec); if (isTextFile(absolute)) out.push(absolute); } return out; }
export function loadDocTree(path: string, cwd: string, home: string, seen: Set<string>, depth: number, maxDepth: number, maxBytes: number, out: ContextDoc[]): void { const real = safeRealpath(path); if (seen.has(real)) return; seen.add(real); const body = readFileBody(path); if (body === null) return; out.push({ path: shortenPath(path, cwd, home), body: body.length > maxBytes ? body.slice(0, maxBytes) : body }); if (depth >= maxDepth) return; for (const child of extractImports(body, dirname(path), home)) loadDocTree(child, cwd, home, seen, depth + 1, maxDepth, maxBytes, out); }
export function gatherContextDocs(cwd: string, home: string, opts?: GatherContextDocsOptions): readonly ContextDoc[] { const out: ContextDoc[] = []; try { const seen = new Set<string>(); const roots = dirChain(cwd); if (home) roots.push(home); for (const dir of roots) for (const name of CANDIDATE_FILES) loadDocTree(join(dir, name), cwd, home, seen, 0, opts?.maxImportDepth ?? DEFAULT_MAX_IMPORT_DEPTH, opts?.maxBytesPerDoc ?? DEFAULT_MAX_BYTES_PER_DOC, out); } catch { return out; } return out; }
