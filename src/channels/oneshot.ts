// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Oneshot channel — a single non-interactive run to settlement.
 *
 * Replaces the print mode. Given a {@link ChannelContext} and an
 * {@link OneshotRequest}, it submits every prompt to the conductor in order,
 * streams the answer to the channel sink, and resolves a process exit code.
 *
 * The shape (clean final text vs a streamed NDJSON event log) is chosen by
 * selecting an {@link OneshotStrategy} object rather than branching on a flag
 * through the runner body: each strategy supplies an optional `onStart`, an
 * optional `onSignal`, and a mandatory `finish` that turns the settled state
 * into the exit code. The runner itself is shape-agnostic — it subscribes the
 * strategy to the conductor signal stream, runs the prompts, and hands the final
 * state to `finish`.
 */
import type { ChannelContext, DialogBridge, OneshotRequest } from "./contract";
/**
 * A dialog bridge for a non-interactive oneshot run: no driver is attached to
 * answer a question, so every `ask` resolves immediately with its caller-supplied
 * fallback and every `tell` is dropped. Keeps the agent from wedging on a prompt
 * during a headless single run while never writing dialog frames to the sink.
 */
export declare const inertDialog: DialogBridge;
/**
 * Run one non-interactive request to settlement.
 *
 * Selects the {@link OneshotStrategy} for `opts.shape`, subscribes it to the
 * conductor signal stream, runs `onStart`, then submits each prompt in order and
 * awaits its settlement. The state from the final prompt is handed to the
 * strategy's `finish`, whose return value is the resolved exit code. The
 * subscription is always torn down before returning.
 *
 * @param ctx  the channel context (conductor, sink, framer, dialog) — fully injected
 * @param opts the request: output shape, the prompts to run, and any images
 * @returns the process exit code (0 on a clean settlement, 1 on a fault)
 */
export declare function runOneshot(ctx: ChannelContext, opts: OneshotRequest): Promise<number>;
