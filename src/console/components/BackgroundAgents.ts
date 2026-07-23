// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * BackgroundAgents — the live sub-agent panel pinned below the input, styled to
 * the "IndusCode Saffron · Background Agents" design.
 *
 * When the primary agent delegates with the `task` tool, each sub-agent run is
 * surfaced here as a compact status row (a spinner/● dot, the agent profile name
 * in saffron, the objective in dim, and a running clock / done / failed status)
 * under a `● main` header — so a user watching several agents work sees them all
 * at a glance in the main screen instead of scrolling the transcript. The panel
 * shows only while at least one run is in flight and hides once they all settle
 * (their final reports remain inline in the transcript).
 *
 * The run list is derived purely from the conversation by {@link deriveAgentRuns}
 * (the `task` tool calls in the assistant messages, matched against their
 * `toolResult` messages for status), so the panel needs no extra session state —
 * it is a projection of `conductor.messages()`.
 */
import { type InkThemeAdapter } from "indusagi/react-ink";
import type { AgentMessage } from "indusagi/agent";
/** The live status of one delegated sub-agent. */
export type AgentRunStatus = "running" | "done" | "error";
/** One delegated sub-agent run, projected from the conversation. */
export interface AgentRun {
    /** The `task` tool-call id correlating the call with its result. */
    readonly id: string;
    /** The agent profile name (the `agent` arg), or "subagent" when unnamed. */
    readonly name: string;
    /** The delegated objective (the `objective` arg), shown as the description. */
    readonly objective: string;
    /** Whether the run is in flight, finished, or errored. */
    readonly status: AgentRunStatus;
    /** Epoch ms the delegating assistant message was stamped (for the run clock). */
    readonly startedAt: number;
}
/**
 * Derive the delegated sub-agent runs from the conversation.
 *
 * Walks the messages once: every `task` tool call in an assistant message
 * becomes a run (named by its `agent` arg, described by its `objective`), and a
 * later `toolResult` with the matching id resolves its status to done/error.
 * Runs with no result yet are "running". Pure and order-stable — the same
 * messages always yield the same list, oldest first.
 *
 * @param messages the live conversation (`conductor.messages()`)
 */
export declare function deriveAgentRuns(messages: readonly AgentMessage[]): AgentRun[];
/** What the {@link BackgroundAgents} renders. */
export interface BackgroundAgentsProps {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** The derived sub-agent runs (from {@link deriveAgentRuns}). */
    readonly runs: readonly AgentRun[];
    /** Live token spend per run, keyed by run id (the task tool-call id). */
    readonly tokens?: Readonly<Record<string, number>>;
    /** Current epoch ms, for the run clock. Defaults to `Date.now()`. */
    readonly now?: number;
}
/**
 * Render the background-agents panel, or nothing when no run is in flight.
 *
 * @param props the theme, the derived runs, and the current time
 */
export declare function BackgroundAgents({ theme, runs, tokens, now }: BackgroundAgentsProps): JSX.Element | null;
