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
import { Type, type Static } from "@sinclair/typebox";
import { capabilityId, type Capability, type CapabilityCard, type DeckContext } from "../contract.js";

/**
 * Reserved key under which a host MAY wire a plan-mode controller into the deck
 * context. The conductor-driven design intercepts the plan tools' result details
 * directly (no handle required), so this is exported only for forward-compat /
 * an alternate host that wants the tool to drive the flip itself.
 */
export const PLAN_HANDLE_KEY = "planController" as const;

/**
 * The narrow port a host may wire to flip the live session into plan mode. Unused
 * by the default (conductor-intercept) wiring; kept for hosts that prefer the tool
 * to signal directly rather than via the tool-result seam.
 */
export interface PlanController {
    /** Switch the session into read-only plan mode for subsequent tool calls. */
    enterPlanMode(): void;
}

const EnterPlanParams = Type.Object({}, { additionalProperties: false });

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

const ExitPlanParams = Type.Object(
    {
        plan: Type.String({
            description:
                "The plan you intend to carry out, in markdown. The user reviews this before approving the exit from plan mode; on approval you leave plan mode and begin.",
        }),
    },
    { additionalProperties: false },
);

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

const ENTER_PLAN_DESCRIPTION =
    "Enter plan mode: a read-only research phase in which you may only read, search, and inspect \u2014 every file-mutating and shell tool is blocked until you leave. Use this when a task needs investigation and a plan before any change is made. While in plan mode, gather all the context you need, then call `exit_plan_mode` with the plan you intend to carry out; the user reviews and approves it before you act.";

const ENTER_PLAN_PROSE =
    "You are now in plan mode (read-only). Investigate freely with the read, search, and listing tools, but do not attempt to edit files or run shell commands \u2014 they are blocked here. When you have a concrete plan, call `exit_plan_mode` with the full plan text so the user can approve it before you make any changes.";

const EXIT_PLAN_DESCRIPTION =
    "Leave plan mode and propose the plan you intend to carry out. Provide the full plan as `plan`; the user reviews it and either approves (you exit plan mode and begin the work) or rejects (you stay in plan mode to revise). Only call this once you have a concrete, reviewed plan \u2014 not to do work, but to ask permission to start it.";

/** Read the optional plan controller handle from the deck context. */
function readPlanController(ctx: DeckContext): PlanController | undefined {
    const handle = ctx.framework?.[PLAN_HANDLE_KEY];
    if (handle && typeof (handle as PlanController).enterPlanMode === "function") {
        return handle as PlanController;
    }
    return undefined;
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
export function buildEnterPlanModeCapability(
    ctx: DeckContext,
): Capability<typeof EnterPlanParams, EnterPlanDetails> {
    const controller = readPlanController(ctx);
    return {
        name: "enter_plan_mode",
        label: "Enter plan mode",
        description: ENTER_PLAN_DESCRIPTION,
        readOnly: true,
        parameters: EnterPlanParams,
        async execute() {
            const applied = controller !== undefined;
            if (controller) controller.enterPlanMode();
            return {
                content: [{ type: "text", text: ENTER_PLAN_PROSE }],
                details: { enterPlanMode: true, applied },
            };
        },
    };
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
export function buildExitPlanModeCapability(
    _ctx: DeckContext,
): Capability<typeof ExitPlanParams, ExitPlanDetails> {
    return {
        name: "exit_plan_mode",
        label: "Exit plan mode",
        description: EXIT_PLAN_DESCRIPTION,
        // Marked read-only so the plan-mode gate never blocks the very tool used to
        // request leaving plan mode (it mutates nothing — the conductor owns the flip).
        readOnly: true,
        parameters: ExitPlanParams,
        async execute(_toolCallId, params) {
            const plan = params.plan;
            return {
                content: [
                    {
                        type: "text",
                        text: `Proposed plan (awaiting your approval to leave plan mode):\n\n${plan}`,
                    },
                ],
                details: { exitPlan: true, plan },
            };
        },
    };
}

/** Catalog row for the EnterPlanMode capability. */
export const enterPlanModeCard: CapabilityCard = {
    id: capabilityId("enter_plan_mode"),
    title: "Enter plan mode",
    summary: "Switch into a read-only research phase where mutating tools are blocked.",
    build: (ctx) => buildEnterPlanModeCapability(ctx),
};

/** Catalog row for the ExitPlanMode capability. */
export const exitPlanModeCard: CapabilityCard = {
    id: capabilityId("exit_plan_mode"),
    title: "Exit plan mode",
    summary: "Propose a plan and request approval to leave plan mode and begin work.",
    build: (ctx) => buildExitPlanModeCapability(ctx),
};