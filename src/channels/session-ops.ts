// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Session ops — the concrete operation registry that drives the link.
 *
 * This is the single declarative source of every operation the link server
 * dispatches and the {@link LinkDriver} client is generated from. Each op binds a
 * wire `method` name to a `handle` that delegates to the {@link SessionConductor}
 * carried on the {@link ChannelContext}; there is no per-method dispatch ladder
 * and no hand-written parallel client method. Adding a row here adds both a
 * server-handled method and a callable driver method.
 *
 * The ops also own the {@link LinkSnapshot} projection: the conductor exposes its
 * internal {@link ConductorState}, and {@link projectSnapshot} reshapes that into
 * the flat, serializable wire vocabulary a remote driver mirrors without holding
 * a live conductor.
 */
import type { ConductorState, LinkSnapshot, Op, ThinkingLevel } from "./contract";
/**
 * Project a conductor {@link ConductorState} onto the wire {@link LinkSnapshot}.
 *
 * The snapshot is the link vocabulary: flat, serializable, and derived from — not
 * a passthrough of — the conductor state. Busy flags are read off the coarse
 * phase, the model and session identity off the state and its head, and the
 * cumulative usage carried straight through.
 *
 * @param state the immutable conductor state
 * @param extra optional fields the conductor does not surface on its state
 */
export declare function projectSnapshot(state: ConductorState, extra?: {
    readonly thinking?: ThinkingLevel;
    readonly sessionFile?: string;
    readonly autoCondense?: boolean;
    readonly messageCount?: number;
    readonly queuedCount?: number;
}): LinkSnapshot;
/** Parameters for the {@link sessionOps.submit} op. */
export interface SubmitParams {
    /** The user message text for this turn. */
    readonly input: string;
}
/** Parameters for the {@link sessionOps.resume} op. */
export interface ResumeParams {
    /** The persisted session to restore. */
    readonly sessionId: string;
}
/** Parameters for the {@link sessionOps.cycleModel} op. */
export interface CycleModelParams {
    /** Canonical id of the model to switch to. */
    readonly modelId: string;
}
/** One model entry returned by the {@link sessionOps.listModels} op. */
export interface ModelEntry {
    /** Canonical model id. */
    readonly id: string;
    /** Whether this is the model currently bound to the session. */
    readonly active: boolean;
}
/**
 * The frozen link op set: every operation a driver can invoke, each delegating
 * to the conductor on the context.
 *
 *   - `submit`     — run a user turn to settlement and reply with a snapshot.
 *   - `abort`      — cancel the in-flight turn and reply with a snapshot.
 *   - `snapshot`   — read the current state, projected to a {@link LinkSnapshot}.
 *   - `resume`     — restore a persisted session and reply with a snapshot.
 *   - `listModels` — list the model bound to the session (the active entry).
 *   - `cycleModel` — rotate the active model and reply with a snapshot.
 *
 * The map is consumed verbatim by the server (data-driven dispatch) and by the
 * generated {@link LinkDriver} (its method set is exactly these keys).
 */
export declare const SESSION_OPS: Readonly<{
    submit: Op<SubmitParams, LinkSnapshot>;
    abort: Op<void, LinkSnapshot>;
    snapshot: Op<void, LinkSnapshot>;
    resume: Op<ResumeParams, LinkSnapshot>;
    listModels: Op<void, readonly ModelEntry[]>;
    cycleModel: Op<CycleModelParams, LinkSnapshot>;
}>;
/** The concrete op-set type, for typing a {@link LinkDriver} over this surface. */
export type SessionOps = typeof SESSION_OPS;
