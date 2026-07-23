// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget / microcompact — clear stale tool-result bodies in place.
 *
 * The cheapest token to reclaim is one that is already dead weight: the verbatim
 * body of a tool result the model has long since acted on. Once an agent has
 * read a file, run a search, or executed a command and moved several turns past
 * it, the full body of that result rarely needs to stay in the window — the
 * model's subsequent reasoning already captured what mattered. Yet those bodies
 * (a 2,000-line `read`, a noisy `bash` log, a wide `grep`) dominate the token
 * budget.
 *
 * **Microcompaction** runs *before* a full {@link condense}: it walks the
 * transcript, keeps the last few tool results verbatim (the model may still be
 * working with them), and replaces the body of every older compactable tool
 * result with a short sentinel. This reclaims tokens for free — no model call,
 * no summary round-trip — and often defers (or shrinks the input to) the real
 * condense.
 *
 * Shape note (this rebuild): a tool result is its OWN top-level
 * {@link ToolResultMessage} (`role: 'toolResult'`), not a block nested inside a
 * user message. Clearing one therefore means replacing *that message's*
 * `content` array with a single sentinel text block — never editing a sub-block
 * of some other message. We only clear results whose owning assistant `toolCall`
 * named a compactable tool, so structural/control results stay intact.
 *
 * Behavior-preserving by construction: when there is nothing to clear (no
 * compactable results, or every one is within the keep window) the *same input
 * reference* is returned, so a caller can cheaply detect a no-op.
 */
import type { AgentMessage } from "./contract.js";
/**
 * The placeholder spliced in where a stale tool-result body used to be. Kept
 * short on purpose — the whole point is to reclaim the tokens the original body
 * occupied — while still signalling to the model (and to a human reading the
 * transcript) that real content was elided rather than lost.
 */
export declare const CLEARED_TOOL_RESULT = "[Old tool result content cleared]";
/**
 * The wire names of tools whose results are safe to clear once stale.
 *
 * These are the read-mostly / output-heavy tools whose bodies are reconstructable
 * (re-read the file, re-run the search) and whose stale content the model has
 * already digested. Control/state tools (todo, memory, task) are deliberately
 * absent — their results can carry standing instructions the model still needs.
 */
export declare const COMPACTABLE_TOOL_NAMES: ReadonlySet<string>;
/**
 * Clear the bodies of stale compactable tool results, keeping the most recent
 * `keepRecent` of them verbatim.
 *
 * Walks the transcript, identifies every `role:'toolResult'` message that
 * belongs to a compactable tool call, keeps the last `keepRecent` (floored at 1
 * — `slice(-0)` would keep everything), and replaces each older one's `content`
 * with a single `{ type:'text', text: CLEARED_TOOL_RESULT }` block. Non-tool
 * messages, control-tool results, and already-cleared results are left exactly
 * as they were.
 *
 * Returns the **same input array reference** when nothing was cleared, so the
 * caller can detect a no-op by identity. Otherwise returns a new array; cleared
 * messages are fresh objects (the originals are not mutated).
 *
 * @param messages the active transcript, oldest-first
 * @param opts.keepRecent how many most-recent compactable results to keep
 *   verbatim (default {@link DEFAULT_KEEP_RECENT}, floored at 1)
 */
export declare function clearStaleToolResults(messages: AgentMessage[], opts?: {
    keepRecent?: number;
}): AgentMessage[];
