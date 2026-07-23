// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * signal-hub — the conductor's product-event hub + framework-event translator.
 *
 * Two cooperating pieces sitting between the framework `Agent` loop and the
 * conductor's consumers:
 *
 *   - {@link SignalHub} — a synchronous, insertion-ordered fan-out bus over the
 *     {@link SessionSignal} stream. Behavior modules emit into it; UI/print/RPC
 *     consumers subscribe to it.
 *   - {@link translateAgentEvent} — the pure projection that turns a single
 *     framework {@link AgentEvent} into the zero-or-more {@link SessionSignal}s
 *     that flow through the hub. {@link TRANSLATOR_TABLE} is the underlying,
 *     exhaustiveness-checked dispatch table (exported for inspection/testing).
 *
 * Typical wiring: subscribe the framework loop, run each raw event through
 * `translateAgentEvent`, and `emit` the results on a `SignalHub`.
 */
export { SignalHub, type SignalHubOptions } from "./hub";
export { translateAgentEvent, TRANSLATOR_TABLE } from "./translate";
