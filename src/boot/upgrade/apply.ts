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
import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { Workspace } from "../contract.js";
import { UPGRADES } from "./upgrades.js";

const MARKER_FILENAME = ".upgrade-state.json";

function markerPath(ws: Workspace): string {
  return join(ws.profileDir, MARKER_FILENAME);
}

async function readAppliedIds(ws: Workspace): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(markerPath(ws), "utf8");
    const parsed = JSON.parse(raw) as { appliedIds?: unknown };
    const ids = Array.isArray(parsed.appliedIds) ? parsed.appliedIds : [];
    return new Set(ids.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

async function writeAppliedIds(ws: Workspace, appliedIds: Set<string>): Promise<void> {
  const state = { appliedIds: [...appliedIds] };
  await fs.mkdir(ws.profileDir, { recursive: true });
  await fs.writeFile(markerPath(ws), `${JSON.stringify(state, null, 2)}\n`);
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

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
export async function applyUpgrades(ws: Workspace): Promise<UpgradeReport> {
  const alreadyApplied = await readAppliedIds(ws);
  const applied: string[] = [];
  const warnings: string[] = [];
  for (const upgrade of UPGRADES) {
    if (alreadyApplied.has(upgrade.id)) continue;
    try {
      await upgrade.apply(ws);
      alreadyApplied.add(upgrade.id);
      applied.push(upgrade.id);
      await writeAppliedIds(ws, alreadyApplied);
    } catch (error) {
      warnings.push(`upgrade "${upgrade.id}" failed: ${describeError(error)}`);
    }
  }
  return { applied, warnings };
}
