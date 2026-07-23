// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * `claude-cli` bridge — drives an Anthropic-flavoured CLI that emits
 * line-delimited stream-json content blocks.
 *
 * Wire dialect (each inbound {@link ChildMessage.payload} is one parsed JSON
 * line of the CLI's NDJSON stdout):
 *   - `{ type: "system", subtype: "init", session_id }` — the CLI announces the
 *     session id it allocated; surfaced as a `resume` event so the broker can
 *     persist it and reattach the same CLI session later.
 *   - `{ type: "content_block_start", content_block: { type } }` — a block opens;
 *     a `tool_use` block carries `{ id, name, input }` which becomes a fully
 *     formed tool call immediately (the CLI batches the input).
 *   - `{ type: "content_block_delta", delta: { type, text | thinking } }` — a
 *     `text_delta` / `thinking_delta` chunk; mapped to a `text` / `thinking`
 *     normalized event. `input_json_delta` chunks (streamed tool arguments) are
 *     ignored here because the bridge emits the tool call from the terminal
 *     `content_block_stop` snapshot.
 *   - `{ type: "message_delta", delta: { stop_reason } }` — carries the final
 *     stop reason, recorded for the eventual `finish`.
 *   - `{ type: "message_stop" }` / `{ type: "result" }` — the turn is over;
 *     finish with the recorded reason.
 *   - `{ type: "error", error: { message } }` — a runtime fault.
 *
 * The opening request is the user turn forwarded as the CLI's prompt body; the
 * spec's binary/args/env are the {@link RuntimeBroker}'s concern when it builds
 * the transport, so this bridge only formats the protocol body.
 *
 * The child process is reached exclusively through the injected
 * {@link ChildTransport}; no `claude` binary is spawned here.
 */
import type { RuntimeBridge } from "../contract";
/**
 * The `claude-cli` {@link RuntimeBridge}. Stateless on the contract surface: it
 * parses the injected transport's stream-json into the sink and returns the
 * framework push stream.
 */
export declare const claudeCliBridge: RuntimeBridge;
