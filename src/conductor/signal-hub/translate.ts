// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * translateAgentEvent — the framework-event → {@link SessionSignal} projector.
 *
 * The framework `Agent` emits a fine-grained {@link AgentEvent} stream for its
 * own loop (lifecycle, per-turn, per-message, per-tool). The conductor does not
 * leak that union to consumers; it projects each framework event down to zero or
 * more *product-level* {@link SessionSignal}s, which then flow through the
 * {@link SignalHub}. This module is that projection — and nothing else: it is a
 * pure, side-effect-free function over a single event.
 *
 * Why a table, not a `switch`:
 *   - The mapping is keyed on the framework event's `type` discriminant, so it is
 *     expressed as a {@link TranslatorTable} — one entry per `AgentEventType`.
 *     The table type is `{ [K in AgentEventType]: (ev) => SessionSignal[] }`, so
 *     adding a framework event variant is a compile error until a rule exists for
 *     it. Exhaustiveness is enforced by the type system, not by a `default` arm.
 *   - Each rule receives the precisely-narrowed event member (via
 *     {@link ExtractAgentEvent}) and returns the signals it produces.
 *
 * Mapping rules (framework `type` → product signals):
 *   - `agent_start` / `turn_start` / `message_start` / `agent_end`
 *                                → `[]`  (loop bookkeeping; not product-visible)
 *   - `message_end`              → one `prompt` { text } for a *user* message
 *                                   (the turn is now committed), one `fault` for
 *                                   an errored *assistant* message, else `[]`
 *   - `tool_execution_start`     → one `tool_start`  { id, name }
 *   - `tool_execution_update`    → one `tool_update` { id, name, details } — the
 *                                   running tool's partial-result detail (e.g. the
 *                                   live `◆ Workflow` snapshot) re-projected so the
 *                                   console can update the transcript in place
 *   - `tool_execution_end`       → one `tool_end`    { id, ok: !isError }
 *   - `turn_end`                 → one `turn_end`    { usage }
 *   - `message_update`           → delegated to the inner streaming dispatch on
 *                                   `assistantMessageEvent.type`:
 *        · `text_delta`     → one `text`     { delta }
 *        · `thinking_delta` → one `thinking` { delta }
 *        · `error`          → one `fault`    { model fault }
 *        · everything else  → `[]`
 *
 * Faults: a streaming `error` sub-event becomes a typed `model` fault. The
 * conductor layers its own `aborted` / `tool` / `persistence` / `overflow`
 * faults elsewhere; the translator only mints the one fault the framework
 * stream actually carries.
 */
import type { AgentEvent, AgentEventType, ExtractAgentEvent } from "indusagi/agent";
import { type SessionSignal } from "../contract";
/** A rule mapping one narrowed framework event member to product signals. */
type TranslatorRule<TType extends AgentEventType> = (event: ExtractAgentEvent<TType>) => SessionSignal[];
/**
 * The dispatch table: exactly one rule per framework {@link AgentEventType}.
 *
 * Declaring it as a full mapped type means the compiler rejects the module until
 * every framework event variant has a rule — the exhaustiveness guarantee.
 */
type TranslatorTable = {
    [K in AgentEventType]: TranslatorRule<K>;
};
/**
 * The frozen mapping from each framework event variant to product signals.
 *
 * Exported for testing/inspection; production code calls
 * {@link translateAgentEvent}, which is the table applied.
 */
export declare const TRANSLATOR_TABLE: TranslatorTable;
/**
 * Translate a single framework {@link AgentEvent} into the product-level
 * {@link SessionSignal}s it produces (zero, one, or — for future fan-out — many).
 *
 * Pure and total: every framework event variant has a rule (enforced by
 * {@link TranslatorTable}), so this never throws on a known event and returns
 * `[]` for events that carry no product meaning.
 *
 * @param event a framework agent loop event
 * @returns the ordered product signals derived from it
 */
export declare function translateAgentEvent(event: AgentEvent): SessionSignal[];
export {};
