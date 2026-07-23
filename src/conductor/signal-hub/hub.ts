// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * SignalHub — the conductor's product-event fan-out.
 *
 * A tiny, synchronous publish/subscribe bus over the {@link SessionSignal}
 * stream. The conductor owns one hub per session: behavior modules (the turn
 * loop, the persistence layer, the auto-condense pass) push signals in via
 * {@link SignalHub.emit}, and every registered consumer handler receives them in
 * registration order.
 *
 * Design (deliberately the conductor's own, not the framework's loop emitter):
 *   - Handlers live in an insertion-ordered `Set`, so registration order is the
 *     delivery order and duplicate handler identities collapse to one slot.
 *   - {@link SignalHub.subscribe} returns an unsubscribe thunk; calling it (even
 *     during a dispatch, even more than once) is safe and idempotent.
 *   - {@link SignalHub.emit} fans out over a *snapshot* of the handler set, so a
 *     handler that subscribes or unsubscribes mid-dispatch never corrupts the
 *     in-progress iteration — the change takes effect on the next emit.
 *   - A throwing handler is isolated: its error is routed to the optional
 *     {@link SignalHubOptions.onHandlerError} sink and the remaining handlers
 *     still run. One bad consumer never silences the others.
 *
 * The hub is transport-agnostic: it knows nothing about the framework `Agent`,
 * persistence, or how signals are produced. The {@link module:translate}
 * translator is what turns raw framework events into the {@link SessionSignal}s
 * that flow through here.
 */
import type { SessionSignal, SignalHandler } from "../contract";
/** Tuning hooks for a {@link SignalHub}. All optional. */
export interface SignalHubOptions {
    /**
     * Invoked when a subscribed handler throws during {@link SignalHub.emit}.
     *
     * Lets the owner observe/log faults in consumer code without aborting the
     * fan-out. If omitted, handler errors are swallowed so a misbehaving consumer
     * cannot break signal delivery to the others. This sink is itself guarded —
     * if it throws, the throw is ignored.
     *
     * @param error   the value the handler threw
     * @param signal  the signal that was being delivered when it threw
     */
    readonly onHandlerError?: (error: unknown, signal: SessionSignal) => void;
}
/**
 * A synchronous fan-out bus for {@link SessionSignal}s.
 *
 * Construct one per session; subscribe consumers; emit signals. Not a framework
 * type and not wired to one — purely the conductor's own event surface.
 */
export declare class SignalHub {
    /** Insertion-ordered live set of subscribed handlers. */
    private readonly handlers;
    private readonly onHandlerError?;
    constructor(options?: SignalHubOptions);
    /**
     * Register a handler to receive every subsequently emitted signal.
     *
     * Registering the same function reference twice is a no-op (the `Set`
     * collapses it). The returned thunk removes the handler; it is idempotent and
     * safe to call during a dispatch.
     *
     * @param handler the consumer callback
     * @returns an unsubscribe function
     */
    subscribe(handler: SignalHandler): () => void;
    /**
     * Fan a signal out to every currently-subscribed handler, in registration
     * order.
     *
     * Iterates a snapshot of the handler set, so subscribe/unsubscribe performed
     * by a handler mid-dispatch affects only later emits. A throwing handler is
     * isolated via {@link SignalHubOptions.onHandlerError}; the remaining handlers
     * still run.
     *
     * @param signal the signal to deliver
     */
    emit(signal: SessionSignal): void;
    /** Number of currently-subscribed handlers. */
    get size(): number;
    /** Remove every handler. Subsequent {@link emit} calls deliver to no one. */
    clear(): void;
    /** Route a handler error to the sink, guarding the sink itself. */
    private report;
}
