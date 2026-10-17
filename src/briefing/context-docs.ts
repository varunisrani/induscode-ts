import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, parse, resolve, sep } from "node:path";
import type { ContextDoc } from "./contract.js";

export interface GatherContextDocsOptions {
  readonly maxImportDepth?: number;
  readonly maxBytesPerDoc?: number;
  /** Exact external files the user explicitly approved for this run. */
  readonly approvedExternalPaths?: readonly string[];
}

export const DEFAULT_MAX_IMPORT_DEPTH = 5;
export const DEFAULT_MAX_BYTES_PER_DOC = 40_000;
export const CANDIDATE_FILES = ["AGENTS.md", "CLAUDE.md", "INDUSAGI.md", "CLAUDE.local.md", "AGENTS.local.md", join(".indusagi", "CLAUDE.md"), join(".claude", "CLAUDE.md")];
export const TEXT_FILE_EXTENSIONS = new Set([".md", ".markdown", ".txt", ".text", ".json", ".jsonc", ".yaml", ".yml", ".toml", ".xml", ".csv", ".html", ".htm", ".css", ".js", ".ts", ".tsx", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".py", ".rb", ".go", ".rs", ".sh"]);
export const IMPORT_REGEX = /(?:^|\s)@((?:[^\s\\]|\\ )+)/g;

const NO_FOLLOW = constants.O_NOFOLLOW ?? 0;
const SECRET_BASENAMES = new Set([
  ".env", "credentials", "credentials.json", "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519",
]);
const SECRET_EXTENSIONS = new Set([".key", ".pem", ".p12", ".pfx"]);

export function shortenPath(path: string, cwd: string, home: string): string {
  if (cwd && (path === cwd || path.startsWith(`${cwd}${sep}`))) {
    const rest = path.slice(cwd.length).replace(/^[/\\]+/, "");
    return rest ? `./${rest}` : ".";
  }
  return home && (path === home || path.startsWith(`${home}${sep}`)) ? `~${path.slice(home.length)}` : path;
}

/** Retained for API compatibility; context discovery no longer walks this chain. */
export function dirChain(cwd: string): string[] {
  const chain: string[] = [];
  let current = cwd;
  for (let i = 0; i < 256; i++) {
    chain.push(current);
    const parent = dirname(current);
    if (parent === current || current === parse(current).root) break;
    current = parent;
  }
  return chain.reverse();
}

export function safeRealpath(path: string): string {
  try { return realpathSync(path); } catch { return path; }
}

export function isTextFile(path: string): boolean {
  const extension = extname(path).toLowerCase();
  return !extension || TEXT_FILE_EXTENSIONS.has(extension);
}

export function isLikelySecretFile(path: string): boolean {
  const name = basename(path).toLowerCase();
  return SECRET_BASENAMES.has(name) || name.startsWith(".env.") || SECRET_EXTENSIONS.has(extname(name));
}

export function readFileBody(path: string): string | null {
  let fd: number | undefined;
  try {
    const before = lstatSync(path);
    if (before.isSymbolicLink() || !before.isFile()) return null;
    fd = openSync(path, constants.O_RDONLY | NO_FOLLOW);
    if (!fstatSync(fd).isFile()) return null;
    const body = readFileSync(fd, "utf8").trim();
    return body || null;
  } catch {
    return null;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export function extractImports(body: string, baseDir: string, home: string): string[] {
  const out: string[] = [];
  IMPORT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMPORT_REGEX.exec(body))) {
    let spec = match[1];
    if (!spec) continue;
    const hash = spec.indexOf("#");
    if (hash >= 0) spec = spec.slice(0, hash);
    spec = spec.replace(/\\ /g, " ").trim();
    if (!spec) continue;
    const absolute = spec.startsWith("~/") ? join(home, spec.slice(2)) : isAbsolute(spec) ? spec : resolve(baseDir, spec);
    if (isTextFile(absolute)) out.push(absolute);
  }
  return out;
}

function canonicalExistingFile(path: string): string | null {
  try {
    const before = lstatSync(path);
    if (before.isSymbolicLink() || !before.isFile()) return null;
    return realpathSync(path);
  } catch {
    return null;
  }
}

function isWithin(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

interface LoadPolicy {
  readonly root: string;
  readonly approvedExternal: ReadonlySet<string>;
}

function loadTrustedDocTree(path: string, cwd: string, home: string, seen: Set<string>, depth: number, maxDepth: number, maxBytes: number, out: ContextDoc[], policy: LoadPolicy): void {
  if (isLikelySecretFile(path)) return;
  const real = canonicalExistingFile(path);
  if (real === null || seen.has(real) || isLikelySecretFile(real)) return;
  if (!isWithin(policy.root, real) && !policy.approvedExternal.has(real)) return;
  seen.add(real);
  const body = readFileBody(real);
  if (body === null) return;
  out.push({ path: shortenPath(real, cwd, home), body: body.length > maxBytes ? body.slice(0, maxBytes) : body });
  if (depth >= maxDepth) return;
  for (const child of extractImports(body, dirname(real), home)) {
    loadTrustedDocTree(child, cwd, home, seen, depth + 1, maxDepth, maxBytes, out, policy);
  }
}

/** Compatibility wrapper with secure default confinement to cwd. */
export function loadDocTree(path: string, cwd: string, home: string, seen: Set<string>, depth: number, maxDepth: number, maxBytes: number, out: ContextDoc[]): void {
  let root: string;
  try { root = realpathSync(cwd); } catch { return; }
  loadTrustedDocTree(path, root, home, seen, depth, maxDepth, maxBytes, out, { root, approvedExternal: new Set() });
}

export function gatherContextDocs(cwd: string, home: string, opts: GatherContextDocsOptions = {}): readonly ContextDoc[] {
  const out: ContextDoc[] = [];
  try {
    const root = realpathSync(cwd);
    const approvedExternal = new Set<string>();
    for (const path of opts.approvedExternalPaths ?? []) {
      const real = canonicalExistingFile(path);
      if (real !== null && !isLikelySecretFile(real)) approvedExternal.add(real);
    }
    const policy = { root, approvedExternal };
    const seen = new Set<string>();
    for (const name of CANDIDATE_FILES) {
      loadTrustedDocTree(join(root, name), root, home, seen, 0, opts.maxImportDepth ?? DEFAULT_MAX_IMPORT_DEPTH, opts.maxBytesPerDoc ?? DEFAULT_MAX_BYTES_PER_DOC, out, policy);
    }
  } catch {
    return out;
  }
  return out;
}