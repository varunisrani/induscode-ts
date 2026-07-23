// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Launch pickers — `pickResumeTarget` and `browseSettings`.
 *
 * Two thin, injectable selection surfaces:
 *
 *   - {@link pickResumeTarget} loads the resumable sessions (current cwd plus
 *     every directory), de-duplicates by path, sorts newest-first, and lets the
 *     user choose one through the framework React-Ink `StartupSessionPicker`. On a
 *     non-interactive stdin it skips the picker and resolves the newest session,
 *     so a piped invocation still resumes deterministically.
 *
 *   - {@link browseSettings} prints a plain readline listing of the resolved
 *     settings and the discovered user resources, then waits for a keypress. No
 *     TUI — a flat console dump the user reads and dismisses.
 *
 * Both keep their effectful pieces (the Ink mount, the readline pause, the TTY
 * probe) behind injectable seams so the selection logic is unit-testable without
 * a terminal.
 */
import type { ResumeFault, ResumeRef, SessionLoader, SettingsBrowseOptions } from "./contract";
/**
 * The effectful seams {@link pickResumeTarget} depends on. Injected so a test can
 * report a non-interactive terminal and stub the picker mount.
 */
export interface ResumeDeps {
    /** Whether stdin is an interactive terminal (drives the non-TTY fast-path). */
    isInteractive(): boolean;
    /**
     * Mount the picker over the session list and resolve with the chosen session,
     * or `null` when the user dismisses it.
     */
    mountPicker(sessions: readonly ResumeRef[], totalCount: number): Promise<ResumeRef | null>;
}
/** The live {@link ResumeDeps}: a real TTY probe and the Ink picker mount. */
export declare function defaultResumeDeps(): ResumeDeps;
/**
 * Merge two session lists into one newest-first list de-duplicated by path.
 *
 * Earlier entries win the path key, then the merged set is sorted by
 * `lastModified` descending. Pure; the picker and the fast-path both consume it.
 */
export declare function mergeSessions(current: readonly ResumeRef[], all: readonly ResumeRef[]): ResumeRef[];
/**
 * The outcome of {@link pickResumeTarget}: the chosen session path, or `null`
 * when there was nothing to resume or the user dismissed the picker. A typed
 * {@link ResumeFault} is returned (never thrown) when the load or mount failed.
 */
export interface ResumeOutcome {
    /** The selected session file path, or `null` for none. */
    readonly path: string | null;
    /** A typed failure, present only when the resume flow could not run. */
    readonly fault?: ResumeFault;
}
/**
 * Choose a session to resume.
 *
 * Loads the current-directory and all-directory session lists, merges them
 * (de-dupe by path, newest first), and either mounts the React-Ink picker or —
 * on a non-interactive stdin — resolves the newest session directly. An empty
 * merged list resolves to `{ path: null }`.
 *
 * @param loadCurrent loader for sessions started in the active cwd
 * @param loadAll     loader for sessions across every directory
 * @param deps        injectable TTY probe and picker mount (defaults to live)
 */
export declare function pickResumeTarget(loadCurrent: SessionLoader, loadAll: SessionLoader, deps?: ResumeDeps): Promise<ResumeOutcome>;
/**
 * The effectful seams {@link browseSettings} depends on: a line sink and a pause
 * that waits for the user to press a key. Injected so a test captures the listing
 * and resolves the pause immediately.
 */
export interface SettingsBrowseIo {
    /** Emit one line of the listing. */
    print(line: string): void;
    /** Wait for the user to dismiss the listing (e.g. press Enter). */
    pause(prompt: string): Promise<void>;
}
/** The live {@link SettingsBrowseIo}: stdout plus a readline pause. */
export declare function defaultSettingsBrowseIo(): SettingsBrowseIo;
/**
 * Build the entire settings listing as an array of lines. Pure — it consumes the
 * resolved settings, the active cwd, the profile directory, and the grouped
 * resource paths, and produces the flat dump {@link browseSettings} prints. Kept
 * separate so a test can assert the content without an io seam.
 */
export declare function renderSettingsListing(opts: SettingsBrowseOptions): string[];
/**
 * Print the settings / resource listing and wait for the user to dismiss it.
 *
 * A plain console dump — no TUI. It renders the resolved settings summary and the
 * discovered resources grouped by category, then pauses for a keypress so the
 * listing stays on screen.
 *
 * @param opts the resolved settings, resource paths, cwd, and profile directory
 * @param io   the injectable line sink and pause (defaults to stdout + readline)
 */
export declare function browseSettings(opts: SettingsBrowseOptions, io?: SettingsBrowseIo): Promise<void>;
