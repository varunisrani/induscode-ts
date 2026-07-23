// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * `codex-cli` bridge — drives an OpenAI-flavoured CLI emitting `--json`
 * turn/item events.
 *
 * Wire dialect (each inbound {@link ChildMessage.payload} is one parsed `--json`
 * event object):
 *   - `{ type: "thread.started", thread_id }` — the CLI opened a thread;
 *     surfaced as a `resume` event so the broker can persist the thread id and
 *     continue it on a later exchange.
 *   - `{ type: "response.output_text.delta", delta }` — a chunk of answer text.
 *   - `{ type: "response.reasoning_text.delta" | "response.reasoning.delta",
 *        delta }` — a chunk of reasoning text.
 *   - `{ type: "response.output_item.done", item }` /
 *     `{ type: "item.completed", item }` — a completed item; a
 *     `function_call` / `tool_call` item becomes a fully-formed tool call (its
 *     `arguments` string is parsed into an object).
 *   - `{ type: "turn.completed" | "response.completed" }` — the turn settled;
 *     finish (tool-bearing turns settle as `toolUse`, else `stop`).
 *   - `{ type: "error" | "turn.failed", error | message }` — a runtime fault.
 *
 * Item-level `*.delta` text is preferred; if a CLI variant only emits whole
 * items, the completed-item handler still surfaces the text. The injected
 * {@link ChildTransport} carries the events — no `codex` binary is spawned here.
 */
import type { RuntimeBridge } from "../contract";
/** The `codex-cli` {@link RuntimeBridge}. */
export declare const codexCliBridge: RuntimeBridge;
