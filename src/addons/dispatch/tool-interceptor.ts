// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * ToolInterceptor pipeline — the composable tool-call boundary.
 *
 * This module is the runtime for the per-tool interception path. It replaces the
 * old two-part arrangement — a nested wrapper that re-bound a tool's `execute`
 * plus a separate before/after hook runner — with one ordered pipeline of
 * {@link ToolInterceptor} stages folded around a single tool execution.
 *
 * The shape of a stage is `enter` (before the tool) and `exit` (after it),
 * either optional. The chain applies them as a reduce:
 *
 *   - **enter, forward.** Each matching stage's `enter` runs in registration
 *     order. A stage may inspect the call, rewrite the decoded `args` (return
 *     `{ args }`), or block the call outright (return a {@link GateDecision} with
 *     `stop: true`). A block short-circuits: no later `enter` runs, the real
 *     tool never executes, and the chain resolves with `blocked` set.
 *   - **execute, once.** With the final (possibly rewritten) args, the chain
 *     invokes the real {@link AgentTool}-style `execute` exactly once.
 *   - **exit, reverse.** Each matching stage's `exit` runs in *reverse*
 *     registration order, so the stage that entered first exits last — it wraps
 *     the outermost layer around the call (classic onion ordering). A stage may
 *     rewrite the result (return a replacement {@link AgentToolResult}); the
 *     rewritten result threads into the next (earlier-registered) stage's exit.
 *
 * Fault isolation: a throw from any `enter`/`exit` stage is converted to an
 * {@link AddonFault} routed to listeners and then treated as a no-op for that
 * stage — enter keeps the prior args (and does not block), exit keeps the prior
 * result. A stage's bug therefore degrades to "this stage did nothing" rather
 * than crashing the tool call. An error *from the real tool* is not swallowed:
 * it is offered to the `exit` stages (via {@link ToolExitContext.error}) and then
 * re-thrown so the agent loop sees it, unless an exit stage produced a
 * replacement result (a deliberate recovery).
 *
 * Matching: a stage's `match` is either an exact wire-facing tool name or `"*"`
 * (every tool). {@link AddonInterceptorChain.matches} answers whether any stage
 * applies to a tool, letting the host skip the pipeline entirely for tools no
 * addon touches.
 */
import type { AddonFaultListener, AddonId, AgentToolResult, InterceptResult, InterceptorChain, ToolEnterContext, ToolInterceptor } from "../contract";
/** The real tool invocation the chain folds around, called with the final args. */
type Execute = (args: Readonly<Record<string, unknown>>) => Promise<AgentToolResult<unknown>>;
/**
 * The concrete {@link InterceptorChain}: an ordered set of {@link ToolInterceptor}
 * stages folded around one tool execution.
 *
 * Build one with {@link AddonInterceptorChain.from} over the host's collected
 * interceptors (registration order preserved). Per tool call, {@link run} selects
 * the matching stages, applies their `enter` forward (honoring an early block),
 * executes the tool, then applies their `exit` in reverse. Stage faults are
 * routed to {@link onFault} listeners and never crash the call.
 */
export declare class AddonInterceptorChain implements InterceptorChain {
    /** Every registered interceptor, in registration order. */
    private readonly interceptors;
    /** Live set of fault listeners, in registration order. */
    private readonly faultListeners;
    /**
     * @param interceptors every addon's recorded interceptors, in the order the
     *   host folded them (registration order = enter order; reverse = exit order)
     */
    constructor(interceptors: readonly ToolInterceptor[]);
    /**
     * Build a chain from a flat list of interceptors.
     *
     * A thin alias for the constructor that reads well at the host's fold site:
     * `AddonInterceptorChain.from(allInterceptors)`.
     *
     * @param interceptors the folded interceptors across all addons
     */
    static from(interceptors: readonly ToolInterceptor[]): AddonInterceptorChain;
    /**
     * Run a tool's execution through the interceptor pipeline.
     *
     * Selects the stages whose `match` admits `ctx.tool`, applies their `enter`
     * forward (rewriting args or short-circuiting on a block), invokes `execute`
     * once with the final args, then applies their `exit` in reverse. A blocked
     * enter resolves with `{ blocked }` and never calls `execute`. When no stage
     * matches, `execute` runs directly with the original args.
     *
     * If the real tool throws, the error is offered to the matching `exit` stages;
     * an exit stage may return a replacement result to recover, otherwise the error
     * is re-thrown to the caller after the exit stages have observed it.
     *
     * @param ctx     the entering call context (tool, callId, initial args)
     * @param execute the real tool invocation, called with the final args
     */
    run(ctx: ToolEnterContext, execute: Execute): Promise<InterceptResult>;
    /** Whether any interceptor matches the given tool name. */
    matches(tool: string): boolean;
    /**
     * Register a listener for per-stage {@link AddonFault}s.
     *
     * Returns an idempotent unsubscribe thunk; registering the same listener twice
     * collapses to one slot.
     *
     * @param listener the fault sink
     */
    onFault(listener: AddonFaultListener): () => void;
    /**
     * Apply the matching stages' `enter` in forward order, folding args rewrites
     * and short-circuiting on the first block. A stage that throws is isolated and
     * skipped (the prior args are kept, no block).
     */
    private applyEnter;
    /**
     * Apply the matching stages' `exit` in reverse order, folding result rewrites.
     * Returns the rewritten result when any stage produced one (or recovered an
     * error), otherwise `undefined` (the caller keeps the original result/error). A
     * stage that throws is isolated and skipped.
     */
    private applyExit;
    /** Route a fault to every listener, guarding each listener against its own throw. */
    private report;
}
/**
 * Record one tool interceptor, stamping it with the matched tool and owning
 * addon — the shape the {@link AddonSurface} produces and the chain consumes.
 *
 * Small convenience for hosts/tests assembling interceptors by hand without
 * going through the full surface builder. The supplied `stage` carries only the
 * enter/exit hooks; `match` and `addon` are filled here.
 *
 * @param addon the addon the interceptor is attributed to
 * @param match the tool name to intercept, or `"*"` for every tool
 * @param stage the enter/exit hooks
 */
export declare function interceptor(addon: AddonId, match: string | "*", stage: Omit<ToolInterceptor, "match" | "addon">): ToolInterceptor;
export {};
