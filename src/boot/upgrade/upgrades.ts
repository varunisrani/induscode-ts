/**
 * Upgrade registry — the ordered, idempotent catalog of one-time profile
 * migrations.
 *
 * This module replaces a bag of magic constants and inlined `try/catch`
 * migration blocks with a *registry*: an explicit, ordered list of named
 * {@link Upgrade} steps. Each step owns a stable {@link Upgrade.id}, a one-line
 * {@link Upgrade.describe}, and an idempotent {@link Upgrade.apply}. The driver
 * ({@link "./apply"}) folds over the list in order, recording the ids it has run
 * in a marker file so a step never runs twice — re-running the whole registry on
 * an already-upgraded profile is a no-op.
 *
 * Idempotence contract (every step must honor it):
 *   - Detect "already done" cheaply and return early without side effects.
 *   - Treat a *missing* source (the thing being migrated from) as success — the
 *     profile is either fresh or already past this point.
 *   - Never destroy data: relocations move-or-skip, never overwrite a live
 *     destination; the legacy source is suffixed, not deleted.
 *
 * The seeded steps fold the legacy on-disk layout into the current one:
 *   1. {@link foldCredentials}   — legacy split auth → one secure `auth.json`.
 *   2. {@link reshelveTranscripts} — loose session files → per-cwd `sessions/`.
 *   3. {@link relocateBinaries}  — managed `fd`/`rg` helpers → the `bin/` dir.
 *   4. {@link renamePromptDir}   — legacy `commands/` dir → `prompts/`.
 *
 * Session-directory encoding note: step 2 must place a transcript under the
 * *same* per-cwd directory name the framework's session manager would compute.
 * The framework publishes no standalone encoder for that name (the encoding is
 * private to its session manager), so this module uses a clearly-named local
 * helper, {@link projectTranscriptDirName}, rather than re-deriving the
 * framework's private per-cwd directory encoding. If the framework later exports
 * an encoder, swap the helper for the import without touching the step logic.
 */
import { promises as fs, constants as fsConstants } from "node:fs";
import { join, dirname, basename } from "node:path";
import type { Workspace } from "../contract.js";

/**
 * One ordered, idempotent profile-layout upgrade.
 *
 * An upgrade is pure data plus one async effect. The registry order is the
 * apply order; the {@link id} is the durable key recorded in the marker file
 * once {@link apply} completes, so it must be stable across releases (renaming an
 * id re-runs the step). {@link apply} must be safe to invoke against a profile in
 * any state — fresh, partially-migrated, or fully-migrated.
 */
export interface Upgrade {
  /** Durable identifier recorded once this step has run. Never rename. */
  readonly id: string;
  /** One-line human summary for logs and `--verbose` output. */
  readonly describe: string;
  /**
   * Perform the upgrade against the resolved {@link Workspace}. Must be
   * idempotent: detect "already applied" and return without side effects.
   *
   * @param ws The resolved, absolute on-disk layout.
   */
  apply(ws: Workspace): Promise<void>;
}

const SECURE_FILE_MODE = 384;
const RETIRED_SUFFIX = ".retired";

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    return (await fs.stat(target)).isDirectory();
  } catch {
    return false;
  }
}

async function isFile(target: string): Promise<boolean> {
  try {
    return (await fs.stat(target)).isFile();
  } catch {
    return false;
  }
}

async function readJsonOrUndefined(target: string): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(target, "utf8"));
  } catch {
    return undefined;
  }
}

async function writeJsonWithMode(target: string, value: unknown, mode: number): Promise<void> {
  await fs.mkdir(dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(value, null, 2)}\n`, { mode });
  await fs.chmod(target, mode);
}

async function relocateWithoutClobber(from: string, into: string): Promise<boolean> {
  if (!(await pathExists(from))) return false;
  if (await pathExists(into)) return false;
  await fs.mkdir(dirname(into), { recursive: true });
  await fs.rename(from, into);
  return true;
}

/**
 * Compute the per-project transcript sub-directory *name* for a working
 * directory.
 *
 * This deliberately does not reproduce the framework session manager's private
 * encoding character-for-character; the framework exposes no public encoder to
 * import, so this is the documented local fallback. It produces a single,
 * filesystem-safe directory leaf that is stable for a given absolute `cwd`:
 * path separators, drive colons, and any other non-portable characters collapse
 * to a single token, and a short content hash is appended so two distinct paths
 * that happen to fold to the same token never collide.
 *
 * The output is used only when *relocating a loose legacy transcript* into the
 * sessions tree; live sessions are always created by the framework itself, so
 * this helper never competes with the framework for the canonical name.
 *
 * @param cwd Absolute working directory the transcript belongs to.
 * @returns A safe directory leaf such as `proj-Users-me-app-1a2b3c4d`.
 */
export function projectTranscriptDirName(cwd: string): string {
  const trimmed = cwd.trim() || "root";
  const folded = trimmed.split(/[^A-Za-z0-9]+/u).filter((segment) => segment.length > 0).join("-");
  const token = folded.length > 0 ? folded : "root";
  return `proj-${token}-${shortPathHash(trimmed)}`;
}

function shortPathHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const LEGACY_OAUTH_FILE = "oauth.json";
const LEGACY_SETTINGS_FILE = "settings.json";
const MANAGED_HELPER_BASENAMES = ["fd", "rg", "fd.exe", "rg.exe"];
const LEGACY_PROMPTS_DIRNAME = "commands";

/**
 * Fold a legacy split credential layout — a standalone `oauth.json` plus an
 * `apiKeys` block embedded in `settings.json` — into the single consolidated
 * `auth.json`, written with owner-only (`0o600`-equivalent) permissions.
 *
 * Idempotent: if `auth.json` already exists, nothing is touched. After a
 * successful fold the legacy `oauth.json` is suffixed (`oauth.json.retired`) and
 * the `apiKeys` block is removed from `settings.json`, so a second run finds no
 * legacy sources and the existing `auth.json` short-circuits it regardless.
 */
export const foldCredentials: Upgrade = {
  id: "fold-credentials-into-secure-auth-file",
  describe: "Consolidate legacy oauth.json + settings.apiKeys into a 0600 auth.json",
  async apply(ws) {
    if (await pathExists(ws.authPath)) return;
    const legacyOauthPath = join(ws.profileDir, LEGACY_OAUTH_FILE);
    const legacySettingsPath = join(ws.profileDir, LEGACY_SETTINGS_FILE);
    const oauth = await readJsonOrUndefined(legacyOauthPath);
    const settings = await readJsonOrUndefined(legacySettingsPath);
    const apiKeys = (settings as { apiKeys?: unknown } | undefined)?.apiKeys;
    const haveOauth = oauth !== undefined && Object.keys(oauth as object).length > 0;
    const haveApiKeys = apiKeys !== undefined && Object.keys(apiKeys as object).length > 0;
    if (!haveOauth && !haveApiKeys) return;
    const folded: Record<string, unknown> = {};
    if (haveOauth) folded.oauth = oauth;
    if (haveApiKeys) folded.apiKeys = apiKeys;
    await writeJsonWithMode(ws.authPath, folded, SECURE_FILE_MODE);
    if (await isFile(legacyOauthPath)) {
      const retiredOauth = `${legacyOauthPath}${RETIRED_SUFFIX}`;
      if (!(await pathExists(retiredOauth))) {
        await fs.rename(legacyOauthPath, retiredOauth);
      }
    }
    if (haveApiKeys && settings && (await isFile(legacySettingsPath))) {
      const { apiKeys: _migrated, ...remaining } = settings as { apiKeys?: unknown } & Record<string, unknown>;
      await fs.writeFile(legacySettingsPath, `${JSON.stringify(remaining, null, 2)}\n`);
    }
  },
};

async function readTranscriptHeader(filePath: string): Promise<{ type?: string; cwd?: string } | undefined> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const firstLine = content.split("\n", 1)[0]?.trim();
    if (!firstLine) return undefined;
    return JSON.parse(firstLine);
  } catch {
    return undefined;
  }
}

/**
 * Relocate loose `*.jsonl` transcripts that were written directly under the
 * profile root (a legacy layout) into the structured per-cwd sessions tree:
 * `sessions/<projectDirName>/<file>`.
 *
 * A loose file is recognized as a transcript by a first-line header of
 * `type: "session"`. The destination project directory is derived from the
 * header's recorded `cwd` via {@link projectTranscriptDirName} (the framework
 * owns no public encoder to delegate to — see this module's header). Each move
 * is skip-on-clobber, so re-running never overwrites an already-relocated
 * transcript, and once no loose transcripts remain the step is a pure no-op.
 */
export const reshelveTranscripts: Upgrade = {
  id: "reshelve-loose-transcripts-into-sessions-dir",
  describe: "Move loose session .jsonl files under the profile root into sessions/<cwd>/",
  async apply(ws) {
    let entries: string[];
    try {
      entries = await fs.readdir(ws.profileDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.endsWith(".jsonl")) continue;
      const loosePath = join(ws.profileDir, entry);
      if (!(await isFile(loosePath))) continue;
      const header = await readTranscriptHeader(loosePath);
      if (header?.type !== "session") continue;
      const projectDir = projectTranscriptDirName(header.cwd ?? ws.profileDir);
      const destination = join(ws.sessionsDir, projectDir, basename(loosePath));
      await relocateWithoutClobber(loosePath, destination);
    }
  },
};

/**
 * Relocate the managed native helper binaries (`fd`, `rg`, and their Windows
 * `.exe` forms) from the legacy `tools/` directory into the canonical managed
 * `bin/` directory ({@link Workspace.binDir}).
 *
 * Each binary is moved skip-on-clobber and independently, so a partially-moved
 * state self-heals on the next run and an already-relocated layout (or a fresh
 * install with no legacy `tools/`) is a no-op.
 */
export const relocateBinaries: Upgrade = {
  id: "relocate-managed-helper-binaries-to-bin",
  describe: "Move managed fd/rg helper binaries from the legacy tools/ dir into bin/",
  async apply(ws) {
    const legacyToolsDir = join(ws.profileDir, "tools");
    if (!(await isDirectory(legacyToolsDir))) return;
    for (const name of MANAGED_HELPER_BASENAMES) {
      const from = join(legacyToolsDir, name);
      if (!(await isFile(from))) continue;
      await relocateWithoutClobber(from, join(ws.binDir, name));
    }
  },
};

/**
 * Rename the legacy command-template directory (`commands/`) to the current
 * prompt-template directory ({@link Workspace.promptsDir}).
 *
 * Idempotent: if the destination already exists the rename is skipped (the
 * profile is already on the current layout), and if the legacy directory is
 * absent there is nothing to do. The rename is whole-directory and
 * non-destructive — a live `prompts/` is never replaced.
 */
export const renamePromptDir: Upgrade = {
  id: "rename-legacy-commands-dir-to-prompts",
  describe: "Rename the legacy commands/ template directory to prompts/",
  async apply(ws) {
    const legacyPromptsDir = join(ws.profileDir, LEGACY_PROMPTS_DIRNAME);
    if (!(await isDirectory(legacyPromptsDir))) return;
    await relocateWithoutClobber(legacyPromptsDir, ws.promptsDir);
  },
};

/**
 * The ordered list of upgrades. Apply order is array order; ids are the durable
 * marker keys. Append new steps to the end — never reorder or rename existing
 * ids, as that would re-run already-applied migrations.
 */
export const UPGRADES: readonly Upgrade[] = [
  foldCredentials,
  reshelveTranscripts,
  relocateBinaries,
  renamePromptDir,
];
