// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Upgrade driver — folds the ordered {@link UPGRADES} registry over a
 * {@link Workspace}, exactly once per step.
 *
 * The driver is the only place that knows about the *marker file*: a small JSON
 * record under the profile directory listing the ids of upgrades that have
 * already run. Each registry step is skipped if its id is present in the marker;
 * otherwise it is applied and, on success, its id is appended and the marker is
 * persisted. A step that throws is *not* recorded (so it is retried next launch)
 * and is reported as a warning rather than aborting the remaining steps — one
 * bad migration must never wedge startup.
 *
 * The result is purely informational: {@link UpgradeReport.applied} lists ids run
 * *this* invocation (empty on an already-current profile), and
 * {@link UpgradeReport.warnings} carries human-readable notes for any step that
 * failed. Callers typically log both and continue.
 */
import type { Workspace } from "../contract";
/**
 * The outcome of an {@link applyUpgrades} pass.
 *
 *   - `applied`  — ids of upgrades that ran successfully *this* invocation, in
 *     apply order. Empty when the profile was already current.
 *   - `warnings` — one entry per step that threw, naming the step and its error.
 *     Non-fatal: applying continues past a failed step.
 */
export interface UpgradeReport {
    /** Ids successfully applied during this call, in order. */
    readonly applied: string[];
    /** Human-readable notes for steps that failed (non-fatal). */
    readonly warnings: string[];
}
/**
 * Apply every not-yet-applied upgrade in {@link UPGRADES}, in registry order,
 * recording each success in the marker file so it never runs again.
 *
 * Steps already named in the marker are skipped. A step that throws is recorded
 * as a warning, left unmarked (so it is retried on a later launch), and does not
 * block the remaining steps. The marker is rewritten after each success, so a
 * crash mid-pass still preserves the progress made so far.
 *
 * @param ws The resolved, absolute on-disk layout to upgrade.
 * @returns The ids applied this pass and any non-fatal warnings.
 */
export declare function applyUpgrades(ws: Workspace): Promise<UpgradeReport>;
