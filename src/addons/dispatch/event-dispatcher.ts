// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * EventDispatcher — the single fan-out / transform / veto engine for the unified
 * colon-named event taxonomy.
 *
 * One {@link AddonEventDispatcher} replaces what were previously two parallel
 * systems (a broad "emit lifecycle events" bus and a low-level "trigger mutation
 * hooks" runner): every {@link HookEvent} flows through one ordered middleware
 * pass, and an addon decides per-subscription whether it merely *observes* the
 * payload, *transforms* it, or *gates* (vetoes) the flow. The three middleware
 * kinds compose in one dispatch:
 *
 *   - `observe`   — fire-and-forget. The handler sees the live payload and
 *                   returns nothing. It cannot alter the value or stop the chain;
 *                   a throw is isolated into an {@link AddonFault} and the run
 *                   continues.
 *   - `transform` — the handler returns a replacement payload, which the
 *                   dispatcher threads into every later handler and ultimately
 *                   back to the caller as {@link DispatchOutcome.payload}. A
 *                   transform that throws is isolated and treated as a no-op
 *                   (the prior payload is kept), so one bad rewriter cannot drop
 *                   the value.
 *   - `gate`      — the handler returns a {@link GateDecision}; the first
 *                   `{ stop: true }` short-circuits the run and is surfaced as
 *                   {@link DispatchOutcome.gate}. A gate that throws is isolated
 *                   and treated as "no veto", so an erroring guard fails open
 *                   rather than wedging the agent.
 *
 * Ordering is registration order across every addon: subscriptions are appended
 * to a per-event list as the host folds each {@link RegisteredManifest} in, and a
 * dispatch walks that list front-to-back. Because a gate stops the walk, a gate
 * registered earlier wins over a transform registered later — the host controls
 * precedence purely through load order, with no priority field to reconcile.
 *
 * Reserved (gate-bearing) events — the events that *guard* something the agent is
 * about to do and therefore honor a veto — are **data-sourced**, not a
 * hard-coded literal. The dispatcher derives the reserved set at construction by
 * scanning a small {@link EventTrait} table keyed by {@link HookEvent}; an event
 * with the `guards` trait is reserved. {@link AddonEventDispatcher.reserved}
 * exposes the derived set so callers (and tests) read the same source of truth
 * the engine uses to decide whether a gate decision is meaningful for an event.
 *
 * The dispatcher is transport-agnostic: it knows nothing about the framework
 * agent loop, the tool boundary, or how an event's payload is produced. Callers
 * push events in; the dispatcher fans them out, folds transforms, short-circuits
 * on a veto, and routes handler faults to listeners.
 */
import type { AddonFaultListener, AddonId, DispatchOutcome, EventDispatcher, EventSubscription, HookEvent, HookHandler } from "../contract";
/**
 * The concrete {@link EventDispatcher}: one engine per session, fed the folded
 * {@link EventSubscription}s of every loaded addon.
 *
 * Build one with {@link AddonEventDispatcher.from} over the host's collected
 * subscriptions (registration order preserved), then call
 * {@link AddonEventDispatcher.dispatch} per event. Handler faults are routed to
 * {@link AddonEventDispatcher.onFault} listeners and never propagate into the
 * agent loop.
 */
export declare class AddonEventDispatcher implements EventDispatcher {
    /** Subscriptions grouped by event, each list in registration order. */
    private readonly byEvent;
    /** Live set of fault listeners, in registration order. */
    private readonly faultListeners;
    /**
     * @param subscriptions every addon's recorded subscriptions, in the order the
     *   host folded them (registration order = dispatch order)
     */
    constructor(subscriptions: readonly EventSubscription[]);
    /**
     * Build a dispatcher from a flat list of subscriptions.
     *
     * A thin alias for the constructor that reads well at the host's fold site:
     * `AddonEventDispatcher.from(allSubscriptions)`.
     *
     * @param subscriptions the folded subscriptions across all addons
     */
    static from(subscriptions: readonly EventSubscription[]): AddonEventDispatcher;
    /**
     * The reserved (gate-bearing) event set, derived from the trait table.
     *
     * Exposed so callers and tests share the engine's own source of truth for
     * which events honor a veto, rather than re-deriving it from a literal.
     */
    get reserved(): ReadonlySet<HookEvent>;
    /**
     * Run an event through its subscribed middleware and return the outcome.
     *
     * Walks the event's subscriptions in registration order: `transform` handlers
     * fold the payload forward, `observe` handlers see the current payload, and the
     * first `gate` handler that returns `{ stop: true }` short-circuits the walk.
     * The returned {@link DispatchOutcome} carries the final (possibly transformed)
     * payload and, when a gate stopped the run, its decision. A handler that throws
     * is isolated into an {@link AddonFault} routed to listeners; the run continues
     * (or, for a gate, fails open).
     *
     * A gate decision is reported regardless of whether the event is reserved, so a
     * caller may inspect {@link DispatchOutcome.gate} for any event; the
     * {@link reserved} set tells the host which events it is *expected* to act on.
     *
     * @param event   the event to dispatch
     * @param payload the initial payload threaded through the chain
     */
    dispatch<TPayload>(event: HookEvent, payload: TPayload): Promise<DispatchOutcome<TPayload>>;
    /** Whether any addon has subscribed to the given event. */
    has(event: HookEvent): boolean;
    /**
     * Register a listener for per-handler {@link AddonFault}s.
     *
     * Returns an idempotent unsubscribe thunk; registering the same listener twice
     * collapses to one slot.
     *
     * @param listener the fault sink
     */
    onFault(listener: AddonFaultListener): () => void;
    /**
     * Invoke one subscription's handler against the current payload, isolating any
     * throw, and return a gate decision when the handler is a gate (otherwise
     * `undefined`).
     *
     * `observe` returns nothing and the payload is left untouched; `transform`
     * folds its return value in via `commit`; `gate` yields its decision. A throw
     * from any kind is converted to an {@link AddonFault} routed to listeners and
     * then swallowed — observe/transform continue with the prior payload, gate
     * fails open (returns no veto).
     */
    private run;
    /** Route a fault to every listener, guarding each listener against its own throw. */
    private report;
}
/**
 * Record one event subscription, stamping it with the owning addon — the shape
 * the {@link AddonSurface} produces and the dispatcher consumes.
 *
 * Small convenience for hosts/tests assembling subscriptions by hand without
 * going through the full surface builder.
 *
 * @param addon   the addon the subscription is attributed to
 * @param event   the event being hooked
 * @param handler the observe/transform/gate middleware
 */
export declare function subscription(addon: AddonId, event: HookEvent, handler: HookHandler): EventSubscription;
