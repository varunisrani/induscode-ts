// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Background-process capability — start, poll, and stop long-lived child
 * processes that outlive a single tool call.
 *
 * App-novel and framework-agnostic: it wraps Node's `child_process.spawn`
 * directly rather than delegating to any framework process controller, so the
 * lifecycle is owned entirely by this card. A long-running command (a dev
 * server, a watcher, a build in `--watch` mode) is launched detached from the
 * tool turn; the agent later polls its captured output or signals it to stop.
 *
 * One tool folds the lifecycle into an `action` discriminant:
 *   - `start` — spawn `command` in a shell, return the assigned handle id.
 *   - `poll`  — return the buffered stdout/stderr (and live/exited status) for a
 *               handle, optionally only the lines appended since the last poll.
 *   - `stop`  — send SIGTERM (escalating to SIGKILL after a grace window) to a
 *               handle's process tree.
 *   - `list`  — enumerate every handle this capability is tracking.
 *
 * Output is captured into bounded ring buffers so a chatty process cannot grow
 * memory without limit; only the most recent lines are retained. The card
 * produces a {@link Capability} (framework `AgentTool`) the conductor consumes.
 */
import { type ChildProcess } from "node:child_process";
import { type Static } from "@sinclair/typebox";
import type { Capability, CapabilityCard, DeckContext } from "../contract";
/** Coarse lifecycle state of a tracked background process. */
export type DaemonState = "running" | "exited" | "signalled";
/** A bounded buffer of recent output lines for one stream. */
interface RingBuffer {
    lines: string[];
    /** Index of the next unread line for incremental polling. */
    cursor: number;
}
/** One tracked background process and its captured state. */
interface DaemonHandle {
    readonly id: string;
    readonly command: string;
    readonly child: ChildProcess;
    state: DaemonState;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    readonly startedAt: number;
    readonly stdout: RingBuffer;
    readonly stderr: RingBuffer;
}
/**
 * An in-process table of background children, owned by one built capability.
 *
 * Each `start` spawns a shell-wrapped child, wires its stdout/stderr into
 * bounded buffers, and records terminal state on `exit`. `stop` escalates from
 * SIGTERM to SIGKILL if the process does not exit within a grace window. The
 * table is per-capability, so one session's daemons are isolated from another's.
 */
export declare class DaemonTable {
    private readonly handles;
    private nextSeq;
    private readonly cwd;
    constructor(cwd: string);
    start(command: string): DaemonHandle;
    get(id: string): DaemonHandle | undefined;
    list(): DaemonHandle[];
    /**
     * Signal a handle's process to terminate. Sends SIGTERM immediately and a
     * SIGKILL after `graceMs` if the child is still alive. Resolves once the
     * child has exited or the kill has been sent.
     */
    stop(handle: DaemonHandle, graceMs?: number): Promise<void>;
}
declare const DaemonParams: import("@sinclair/typebox").TObject<{
    action: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"start">, import("@sinclair/typebox").TLiteral<"poll">, import("@sinclair/typebox").TLiteral<"stop">, import("@sinclair/typebox").TLiteral<"list">]>;
    command: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    id: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    sinceLast: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
/** Statically-inferred parameter type the capability's `execute` receives. */
export type DaemonParamsType = Static<typeof DaemonParams>;
/** Structured detail returned alongside the model-facing content. */
export interface DaemonDetails {
    readonly action: "start" | "poll" | "stop" | "list";
    readonly ok: boolean;
    readonly id?: string;
    readonly state?: DaemonState;
    readonly exitCode?: number | null;
    readonly processes?: ReadonlyArray<{
        readonly id: string;
        readonly command: string;
        readonly state: DaemonState;
    }>;
}
/**
 * Build the background-process capability, binding it to a fresh per-session
 * {@link DaemonTable} scoped to the context's working directory.
 *
 * @param ctx the deck context — its `cwd` is where launched processes run.
 */
export declare function buildDaemonCapability(ctx: DeckContext): Capability<typeof DaemonParams, DaemonDetails>;
/** Catalog row for the background-process capability. */
export declare const daemonCard: CapabilityCard;
export {};
