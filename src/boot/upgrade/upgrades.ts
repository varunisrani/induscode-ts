// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
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
import type { Workspace } from "../contract";
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
export declare function projectTranscriptDirName(cwd: string): string;
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
export declare const foldCredentials: Upgrade;
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
export declare const reshelveTranscripts: Upgrade;
/**
 * Relocate the managed native helper binaries (`fd`, `rg`, and their Windows
 * `.exe` forms) from the legacy `tools/` directory into the canonical managed
 * `bin/` directory ({@link Workspace.binDir}).
 *
 * Each binary is moved skip-on-clobber and independently, so a partially-moved
 * state self-heals on the next run and an already-relocated layout (or a fresh
 * install with no legacy `tools/`) is a no-op.
 */
export declare const relocateBinaries: Upgrade;
/**
 * Rename the legacy command-template directory (`commands/`) to the current
 * prompt-template directory ({@link Workspace.promptsDir}).
 *
 * Idempotent: if the destination already exists the rename is skipped (the
 * profile is already on the current layout), and if the legacy directory is
 * absent there is nothing to do. The rename is whole-directory and
 * non-destructive — a live `prompts/` is never replaced.
 */
export declare const renamePromptDir: Upgrade;
/**
 * The ordered list of upgrades. Apply order is array order; ids are the durable
 * marker keys. Append new steps to the end — never reorder or rename existing
 * ids, as that would re-run already-applied migrations.
 */
export declare const UPGRADES: readonly Upgrade[];
