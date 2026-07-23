// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * AgentsView — the drill-in sub-agent view, styled to the "IndusCode Saffron ·
 * Subagent View" design.
 *
 * Opened from the main screen (← on an empty prompt while sub-agents are
 * running), this replaces the transcript with a focused, navigable view of the
 * delegated sub-agents: ↑/↓ moves the selection through `main` + each sub-agent,
 * and the panel above the picker live-previews the selected sub-agent's activity
 * stream — its reasoning and the tools it is using, just like the main screen —
 * with a running clock and token count. Selecting `main` and pressing Enter (or
 * Esc) returns to the main session.
 *
 * It is fed entirely by props the surface already holds: the derived
 * {@link AgentRun}s plus the per-sub-agent live activity / token maps captured
 * from the task tool's streamed progress. Its own {@link useInput} owns the
 * keyboard while it is mounted (the surface gates its main handler off).
 */
import { type InkThemeAdapter } from "indusagi/react-ink";
import type { AgentRun } from "./BackgroundAgents";
import type { ActivityLine } from "../../capability-deck/cards/task-card";
/** What the {@link AgentsView} renders. */
export interface AgentsViewProps {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** The delegated sub-agent runs (from `deriveAgentRuns`). */
    readonly runs: readonly AgentRun[];
    /** Live activity streams per run id (from the task tool's progress). */
    readonly activity: Readonly<Record<string, readonly ActivityLine[]>>;
    /** Live token spend per run id. */
    readonly tokens: Readonly<Record<string, number>>;
    /** Current epoch ms, for the run clock. Defaults to `Date.now()`. */
    readonly now?: number;
    /** Return to the main session. */
    readonly onExit: () => void;
}
/**
 * Render the drill-in agents view.
 *
 * @param props the theme, runs, live activity/token maps, and the exit callback
 */
export declare function AgentsView({ theme, runs, activity, tokens, now, onExit }: AgentsViewProps): JSX.Element;
