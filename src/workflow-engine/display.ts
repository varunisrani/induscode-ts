// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Workflow progress snapshot model + text renderer.
 *
 * The engine emits lifecycle callbacks (phase started, agent started/ended,
 * log) which a host folds into a {@link WorkflowSnapshot}. This module owns the
 * snapshot's pure data shape, the two pure recompute helpers, and the
 * `renderWorkflowText` / `renderWorkflowLines` renderers that turn a snapshot
 * into the `◆ Workflow:` progress tree shown live in the tool result.
 *
 * The renderer is a verbatim behavioral port of pi-dynamic-workflows'
 * `src/display.ts` — same `◆ Workflow: name (x/y done)` header, same per-phase
 * `▶/✓` markers with `done/total · running · errors · skipped` counts, same
 * `    #id <glyph> label` subagent rows, same status glyphs
 * (`○ queued`, `● running`, `✓ done`, `✗ error`, `- skipped`), same "Unphased"
 * group, same trailing `log:` lines.
 *
 * Unlike pi, this file carries NO framework-UI bindings (no `ExtensionContext`,
 * no widget display). The card/console wiring that consumes these renderers
 * lands in stage 2; here we expose only the pure snapshot + string surface.
 */
import type { WorkflowMeta } from "./parse";
/** Lifecycle status of a single workflow subagent row. */
export type WorkflowAgentStatus = "queued" | "running" | "done" | "error" | "skipped";
/** One subagent's row in the live progress tree. */
export interface WorkflowAgentSnapshot {
    /** 1-based id, the order the agent started in. */
    id: number;
    /** Short human label for the agent (defaulted from phase + index if absent). */
    label: string;
    /** The phase the agent belongs to, if any. */
    phase?: string;
    /** The task prompt the agent was given. */
    prompt: string;
    /** Current lifecycle status. */
    status: WorkflowAgentStatus;
    /** Optional short preview of the agent's result. */
    resultPreview?: string;
    /** Optional error summary when the agent failed or was skipped. */
    error?: string;
    /** Wall-clock ms when the subagent started (for the live elapsed counter). */
    startedAt?: number;
    /** Wall-clock ms when the subagent settled (caps the elapsed counter). */
    endedAt?: number;
    /** Cumulative input tokens the subagent has spent. */
    tokensIn?: number;
    /** Cumulative output tokens the subagent has spent. */
    tokensOut?: number;
    /** How many tool calls the subagent has started. */
    toolCount?: number;
    /** The tool the subagent is running right now, if any. */
    currentTool?: string;
    /** The last tool the subagent finished (when nothing is running). */
    lastTool?: string;
}
/** The full live progress model for one workflow run. */
export interface WorkflowSnapshot {
    /** Workflow name (from `meta.name`). */
    name: string;
    /** Workflow description (from `meta.description`). */
    description?: string;
    /** Declared/observed phase titles, in order. */
    phases: string[];
    /** The phase currently active (last `phase()` call). */
    currentPhase?: string;
    /** Log lines emitted via `log()`. */
    logs: string[];
    /** Every subagent row, in start order. */
    agents: WorkflowAgentSnapshot[];
    /** Total agents seen. */
    agentCount: number;
    /** Agents currently running. */
    runningCount: number;
    /** Agents finished successfully. */
    doneCount: number;
    /** Agents that errored. */
    errorCount: number;
    /** Total run duration once complete. */
    durationMs?: number;
    /** The workflow's final returned value once complete. */
    result?: unknown;
}
/** Tunables for the text renderer (how much of the tree to show). */
export interface WorkflowDisplayOptions {
    /** Max subagent rows shown per phase (most recent kept). Default 8. */
    maxAgents?: number;
    /** Max trailing log lines shown. Default 2. */
    maxLogs?: number;
    /** Append a short result preview to each agent row. Default false. */
    showResultPreviews?: boolean;
    /**
     * Soft cap on total tree lines for the LIVE render. Default 9 — headroom under
     * the framework `TaskPanel` 10-line clamp so a running agent is never cut off
     * by a trailing `…`. Completed phases collapse to one line each, and if the
     * tree is still over budget the OLDEST completed phases collapse into a single
     * `… N earlier phases done` line (running/current phases are never collapsed).
     * Pass a large value (e.g. the settled/final render, or Ctrl+O expand) to show
     * everything in full.
     */
    maxLines?: number;
}
/**
 * Build an empty snapshot for a freshly parsed workflow `meta`.
 *
 * @param meta the workflow header
 */
export declare function createWorkflowSnapshot(meta: WorkflowMeta): WorkflowSnapshot;
/**
 * Recompute the derived counts (`agentCount`/`runningCount`/`doneCount`/
 * `errorCount`) from the `agents` array. Pure — returns a new snapshot.
 *
 * @param snapshot the snapshot whose counts to refresh
 */
export declare function recomputeWorkflowSnapshot(snapshot: WorkflowSnapshot): WorkflowSnapshot;
/**
 * Render the snapshot as the `◆ Workflow:` progress tree (array of lines).
 *
 * The per-agent metrics segment (elapsed seconds, token spend, tool activity) is
 * computed at render time from `now` so the seconds tick on every render even
 * during a long silent tool call. Keep `now` an explicit param so the renderer
 * stays pure and testable.
 *
 * @param snapshot the progress model
 * @param options render tunables
 * @param now the current wall-clock ms used to compute live elapsed seconds
 */
export declare function renderWorkflowLines(snapshot: WorkflowSnapshot, options?: WorkflowDisplayOptions, now?: number): string[];
/**
 * Render the snapshot as a single string for the tool result.
 *
 * For the LIVE (not-completed) render the `◆ Workflow:` header already says the
 * run is in progress, so no extra header line is added — this saves a line under
 * the framework `TaskPanel` 10-line clamp. The final (completed) render keeps the
 * explicit `Workflow completed` header.
 *
 * @param snapshot the progress model
 * @param completed whether the run has finished
 * @param options render tunables
 * @param now the current wall-clock ms used to compute live elapsed seconds
 */
export declare function renderWorkflowText(snapshot: WorkflowSnapshot, completed?: boolean, options?: WorkflowDisplayOptions, now?: number): string;
/**
 * One-line preview of an arbitrary result value (string passthrough, else
 * JSON), truncated to `max` chars. Used to fill `resultPreview`.
 *
 * @param value the result to preview
 * @param max max preview length
 */
export declare function preview(value: unknown, max?: number): string;
