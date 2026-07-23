// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Startup gathering — the pure resource/notices/changelog reader the banner draws.
 *
 * The interactive console opens with a one-shot survey of what the session has to
 * work with: which context documents the agent will read, which capability cards
 * (skills) and prompt templates (commands) were discovered on disk, and a count
 * of each. This module *gathers* that survey and nothing else — it returns a
 * small, render-agnostic {@link StartupMap} the banner turns into a bordered
 * panel. It performs only read-only filesystem probes (existence checks plus the
 * briefing loaders) and holds no state; given the same disk it returns the same
 * value, so a test can drive it against a temp tree.
 *
 * It also reads (when present) a `CHANGELOG.md` at the app root and folds it into
 * a {@link StartupChangelog} the banner shows on a version bump — full on the
 * first sight of a new version, a one-line "updated to" note otherwise. The
 * decision of *which* of those to show is the gatherer's: it is handed the
 * running version and the last-seen version and reports a `mode`, so the banner
 * stays a dumb renderer.
 *
 * Nothing here imports React or Ink. The banner imports the *shapes* below and
 * the surface calls {@link gatherStartup} once at mount; the two never share
 * mutable state.
 */
/**
 * One labelled group inside the startup map.
 *
 * A section is a title, the per-entry display lines (already shortened for the
 * terminal), and the *full* count the lines were derived from — which may exceed
 * the number of lines when the renderer elides a long list. A section with no
 * entries is omitted by {@link gatherStartup} rather than emitted empty.
 */
export interface StartupSection {
    /** The group heading (e.g. `"Context"`, `"Skills"`). */
    readonly title: string;
    /** The display lines, one per surfaced entry, already path-shortened. */
    readonly lines: readonly string[];
    /** How many entries the section spans (>= `lines.length`). */
    readonly count: number;
}
/**
 * The gathered survey the banner renders as the "Startup Map" panel.
 *
 * A flat ordered list of {@link StartupSection}s. Empty when nothing was found,
 * in which case the banner renders no panel at all.
 */
export interface StartupMap {
    /** The discovered sections, in display order. */
    readonly sections: readonly StartupSection[];
}
/**
 * The changelog survey the banner may render as a "What is new" block.
 *
 *   - `mode: "none"`     — no changelog to show (no file, or no version change).
 *   - `mode: "full"`     — the running version is newer than last-seen *and* the
 *     full body is worth showing; `markdown` carries it.
 *   - `mode: "condensed"`— a version change with no body to expand (or the body
 *     suppressed); only the one-line note is shown.
 */
export type StartupChangelogMode = "none" | "full" | "condensed";
/** The gathered changelog survey, with the running version it was keyed to. */
export interface StartupChangelog {
    /** Which of the three presentations the banner should render. */
    readonly mode: StartupChangelogMode;
    /** The running product version this survey was computed against. */
    readonly version: string;
    /** The condensed changelog body (present for `full`), markdown source. */
    readonly markdown?: string;
}
/** The per-line tone a startup notice carries. */
export type StartupNoticeKind = "error" | "warning" | "info";
/** One out-of-band notice the banner renders above the wordmark region. */
export interface StartupNotice {
    /** The tone the line is themed with. */
    readonly kind: StartupNoticeKind;
    /** The notice text. */
    readonly text: string;
}
/** What {@link gatherStartup} is handed to compute the survey. */
export interface StartupInputs {
    /** The working directory the session is scoped to. */
    readonly cwd: string;
    /** The user's home directory (where global resources live). */
    readonly home: string;
    /** The running product version (for the changelog survey). */
    readonly version: string;
    /** The last version the user has already seen a changelog for, if any. */
    readonly lastSeenVersion?: string;
    /** Absolute path of the app-root `CHANGELOG.md`, if the app knows one. */
    readonly changelogPath?: string;
}
/**
 * Gather the startup map: the context documents, skills, and prompt templates
 * the session opens with, each as a {@link StartupSection}. Empty sections are
 * dropped, so a brand-new checkout with nothing on disk yields `{ sections: [] }`
 * and the banner renders no panel.
 *
 * Pure with respect to its {@link StartupInputs}: only read-only filesystem
 * probes, no writes, no caching.
 *
 * @param inputs the roots and version context to survey against
 */
export declare function gatherStartup(inputs: StartupInputs): StartupMap;
/**
 * Gather the changelog survey for the banner.
 *
 * The presentation depends on the version delta:
 *   - no `CHANGELOG.md`, or the running version equals the last-seen version →
 *     `mode: "none"` (nothing shown);
 *   - a version change with a non-empty condensed body → `mode: "full"` and the
 *     body in `markdown`;
 *   - a version change whose condensed body is empty → `mode: "condensed"` (only
 *     the one-line "updated to" note).
 *
 * When the app does not track a last-seen version (`lastSeenVersion` absent), a
 * present `CHANGELOG.md` is always surfaced condensed so the note still appears.
 *
 * @param inputs the version context and optional changelog path
 */
export declare function gatherChangelog(inputs: StartupInputs): StartupChangelog;
