// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Token estimation — the heuristic "meter stick" for the window-budget
 * subsystem.
 *
 * Before we can decide whether the transcript is over budget (gate.ts) or where
 * to slice it (slice.ts), we need a cheap, deterministic estimate of how many
 * tokens each {@link AgentMessage} occupies. We do *not* call a tokenizer; we
 * walk the serialized content and apply a small, transparent weighting model.
 *
 * Design notes (clean-room, deliberately distinct from any chars/4 + flat-image
 * baseline):
 *   - The estimate is computed over a *serialization* of each message's
 *     payload, not over a JSON blob of the whole object — structural framing
 *     (braces, quotes, field names) is accounted for with small per-block adds
 *     rather than being measured character-for-character.
 *   - Constants below are this module's OWN tunables (a fractional
 *     bytes-per-token divisor plus per-block framing adds and a flat image
 *     cost). They are intentionally not the legacy fingerprint values.
 *   - The estimator is conservative (rounds up, adds framing) so the gate fires
 *     a little early rather than a little late — overflowing the window is worse
 *     than condensing one turn sooner than strictly necessary.
 */
import type { AgentMessage } from "../contract.js";
/**
 * Estimate the token cost of one message in isolation. Exposed so the slice
 * planner can build a prefix-sum without re-deriving the per-message weight.
 *
 * Cost = `ceil(serialized_chars / CHARS_PER_TOKEN)` + framing tokens +
 * `images * IMAGE_TOKENS`. Always `>= 0` and biased high (conservative).
 */
export declare function estimateMessageTokens(message: AgentMessage): number;
/**
 * Estimate the total token cost of a transcript: the sum of every message's
 * {@link estimateMessageTokens}. This is a pure heuristic — the gate prefers a
 * provider-anchored figure when one exists, and only falls back to this.
 */
export declare function estimateTokens(messages: AgentMessage[]): number;
/**
 * Build a FORWARD prefix-sum array of per-message token estimates.
 *
 * Returns an array of length `messages.length + 1` where `result[i]` is the
 * total estimated tokens of `messages[0 .. i)` (so `result[0] === 0` and
 * `result[messages.length] === estimateTokens(messages)`). This monotonically
 * non-decreasing array is exactly what {@link planSlice} binary-searches to find
 * the cut boundary in O(log n).
 */
export declare function prefixTokens(messages: AgentMessage[]): number[];
