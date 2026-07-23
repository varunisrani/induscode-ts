// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Plan-file persistence — write and read the approved plan a plan-mode session
 * produces, as a slug-named markdown file under a per-session plans directory.
 *
 * Plan mode is a read-only "research first, act second" stance: the agent
 * explores under {@link EnterPlanMode}, drafts a plan, and proposes leaving plan
 * mode with {@link ExitPlanMode}. When the user approves the exit, the plan text
 * the model authored is durable — saved here so it survives the session and can
 * be reviewed, diffed, or fed back later. The conductor owns the approval
 * handshake; this module owns only the bytes-on-disk concern.
 *
 * The filename is derived from a stable slug of the plan's first line (its de
 * facto title), prefixed with a short timestamp so successive plans in one
 * session never collide. Writing is best-effort from the caller's perspective —
 * a write failure surfaces as a thrown error the conductor swallows into a
 * non-fatal note rather than faulting the turn.
 */
/** The directory plans are written under (relative to the session scope dir). */
export declare const PLANS_DIRNAME: "plans";
/**
 * Derive a filesystem-safe slug from a plan's text — its first non-empty line,
 * lower-cased, with every run of non-alphanumeric characters collapsed to a
 * single dash and the result trimmed and length-capped. Falls back to `"plan"`
 * when the text yields nothing usable (empty, or punctuation-only).
 *
 * @param plan the plan body whose first line seeds the slug
 */
export declare function planSlug(plan: string): string;
/**
 * Resolve the absolute path a plan with `slug` is written to under `sessionDir`.
 * The `plans/` sub-directory is implied; callers pass the session scope dir and
 * get back `<sessionDir>/plans/<slug>.md`.
 *
 * @param sessionDir the per-session directory plans live beneath
 * @param slug       the derived slug (see {@link planSlug})
 */
export declare function planFilePath(sessionDir: string, slug: string): string;
/**
 * Write the plan body to a slug-named markdown file under `sessionDir/plans`,
 * creating the directory as needed, and return the absolute path written. The
 * filename is `<short-timestamp>-<slug>.md` so repeated plans in one session do
 * not overwrite each other.
 *
 * Throws on an I/O failure (the conductor swallows it into a non-fatal note).
 *
 * @param sessionDir the per-session directory plans live beneath
 * @param plan       the plan body to persist
 */
export declare function writePlan(sessionDir: string, plan: string): string;
/**
 * Read a previously-written plan file back, or `undefined` when it is missing or
 * unreadable. Used by tests and by any review surface that wants the saved plan.
 *
 * @param path the absolute plan-file path (see {@link planFilePath} / {@link writePlan})
 */
export declare function readPlan(path: string): string | undefined;
