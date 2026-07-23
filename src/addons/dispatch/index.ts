// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Dispatch subsystem — public barrel.
 *
 * The unified hook + tool-interception runtime, written against the frozen
 * {@link module:../contract} surface:
 *
 *   - {@link AddonEventDispatcher} — the single fan-out / transform / veto engine
 *     for the colon-named {@link HookEvent} taxonomy. Folds every addon's
 *     {@link EventSubscription}s into one ordered middleware pass (observe /
 *     transform / gate), short-circuits on the first veto, and derives its
 *     reserved (gate-bearing) event set from a data table rather than a literal.
 *   - {@link AddonInterceptorChain} — the composable tool-call boundary. Folds
 *     every addon's {@link ToolInterceptor} stages around one tool execution
 *     (enter forward, exit reverse), rewriting args/results or blocking the call,
 *     replacing the old tool wrapper plus before/after hook runner.
 *
 * Both isolate handler/stage faults into {@link AddonFault}s routed to listeners
 * so a misbehaving addon never crashes the agent loop. The `subscription` and
 * `interceptor` helpers mint the contract's recorded shapes for hosts/tests that
 * assemble them outside the full surface builder.
 */
export { AddonEventDispatcher, subscription } from "./event-dispatcher";
export { AddonInterceptorChain, interceptor } from "./tool-interceptor";
