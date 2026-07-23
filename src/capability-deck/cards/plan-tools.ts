// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Plan-mode capabilities — the two tools that bracket a read-only planning phase.
 *
 *   - {@link enterPlanModeTool} (`enter_plan_mode`) is a **read-only** tool: when
 *     invoked it returns a structured detail `{ enterPlanMode: true }` plus
 *     explore-only prose. It carries no side effect of its own — the **conductor**
 *     watches the tool-result seam for `enterPlanMode` and switches the session
 *     into the `plan` permission mode (research-only — every mutating tool is
 *     blocked at the permission gate), capturing the pre-plan mode so it can be
 *     restored on exit. It is marked `readOnly: true` so it is itself always
 *     permitted, even inside plan mode.
 *
 *   - {@link exitPlanModeTool} (`exit_plan_mode`) likewise does NOT flip the mode
 *     itself — a tool cannot drive the interactive approval dialog. It returns a
 *     structured detail `{ exitPlan: true, plan }` that the conductor intercepts:
 *     the conductor raises the user-approval prompt, and on approval restores the
 *     pre-plan mode + injects the approved plan as context for the next turn,
 *     persisting it to a plan file. On reject the session stays in plan mode.
 *
 * Keeping every side effect (mode flip, approval, persistence) in the conductor
 * rather than the tool keeps the tools pure, side-effect-light, and assemblable in
 * any environment, including tests — and lets the conductor own the single
 * permission-mode source of truth.
 */
import { type Static } from "@sinclair/typebox";
import type { Capability, CapabilityCard, DeckContext } from "../contract";
/**
 * Reserved key under which a host MAY wire a plan-mode controller into the deck
 * context. The conductor-driven design intercepts the plan tools' result details
 * directly (no handle required), so this is exported only for forward-compat /
 * an alternate host that wants the tool to drive the flip itself.
 */
export declare const PLAN_HANDLE_KEY: "planController";
/**
 * The narrow port a host may wire to flip the live session into plan mode. Unused
 * by the default (conductor-intercept) wiring; kept for hosts that prefer the tool
 * to signal directly rather than via the tool-result seam.
 */
export interface PlanController {
    /** Switch the session into read-only plan mode for subsequent tool calls. */
    enterPlanMode(): void;
}
declare const EnterPlanParams: import("@sinclair/typebox").TObject<{}>;
/** Statically-inferred parameter type EnterPlanMode's `execute` receives. */
export type EnterPlanParamsType = Static<typeof EnterPlanParams>;
/** Structured detail returned by EnterPlanMode. */
export interface EnterPlanDetails {
    /**
     * The marker the conductor intercepts on the tool-result seam to switch the
     * session into plan mode (and capture the pre-plan mode for a later restore).
     */
    readonly enterPlanMode: true;
    /** Whether an optional in-context controller also applied the switch directly. */
    readonly applied: boolean;
}
/**
 * Build the EnterPlanMode capability. On invoke it asks the wired
 * {@link PlanController} to switch the session into plan mode, then returns
 * explore-only prose. It is `readOnly: true`, so the permission gate always
 * permits it (including inside plan mode itself).
 *
 * @param ctx the deck context; an optional controller is read from
 *            `ctx.framework[PLAN_HANDLE_KEY]`.
 */
export declare function buildEnterPlanModeCapability(ctx: DeckContext): Capability<typeof EnterPlanParams, EnterPlanDetails>;
declare const ExitPlanParams: import("@sinclair/typebox").TObject<{
    plan: import("@sinclair/typebox").TString;
}>;
/** Statically-inferred parameter type ExitPlanMode's `execute` receives. */
export type ExitPlanParamsType = Static<typeof ExitPlanParams>;
/**
 * Structured detail returned by ExitPlanMode. The conductor watches the
 * tool-result seam for `exitPlan === true`, captures the {@link plan}, and runs
 * the approval handshake (the tool itself does not flip the mode or prompt).
 */
export interface ExitPlanDetails {
    /** The marker the conductor intercepts to start the exit-plan handshake. */
    readonly exitPlan: true;
    /** The plan text the model authored, surfaced to the user for approval. */
    readonly plan: string;
}
/**
 * Build the ExitPlanMode capability. It performs no mode flip and no prompt of
 * its own — it returns the `{ exitPlan: true, plan }` detail the conductor
 * intercepts. The model-facing content echoes the proposed plan so a transcript
 * reader sees what was put up for approval.
 *
 * Not marked read-only: it represents the request to RESUME mutating work, so in
 * plan mode it must still be permitted explicitly (the gate special-cases the
 * plan tools alongside read-only tools — see the conductor wiring).
 */
export declare function buildExitPlanModeCapability(_ctx: DeckContext): Capability<typeof ExitPlanParams, ExitPlanDetails>;
/** Catalog row for the EnterPlanMode capability. */
export declare const enterPlanModeCard: CapabilityCard;
/** Catalog row for the ExitPlanMode capability. */
export declare const exitPlanModeCard: CapabilityCard;
export {};
