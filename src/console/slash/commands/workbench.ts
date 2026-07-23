// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Workbench slash commands — the pickers, display blocks, and help surfaces.
 *
 * This group covers the overlays a user reaches for to inspect or retune the
 * session: the model pickers, the per-scope routing editor, the colour-scheme
 * switch, the settings list, the command palette (`/help`), the keyboard map
 * (`/keys`), the project changelog (`/whats-new`), and a diagnostics dump
 * (`/debug`). The picker handlers stay thin — they raise an overlay through
 * {@link SlashContext.openModal} or flip a reducer flag — while the help,
 * keys, whats-new, and debug handlers do real work: they read the live slash
 * catalog, the grounded keymap, a `CHANGELOG.md` on disk, and the conductor's
 * session statistics, then surface the result as a display block or a written
 * file rather than a dead placeholder.
 */
import type { SlashCommand } from "../../contract";
/**
 * The workbench command rows, in listing order. Pickers and help surfaces open
 * an overlay; the changelog drops a display block; debug flips a toggle and
 * reports it.
 */
export declare const workbenchCommands: SlashCommand[];
