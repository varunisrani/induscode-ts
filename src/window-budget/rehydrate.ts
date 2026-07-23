// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Window-budget / rehydrate — re-attach recently-read files after a condense.
 *
 * A full {@link condense} folds the dropped head of the transcript into one
 * summary message. That digest captures *what happened*, but it necessarily
 * loses the verbatim bodies of files the agent had just read — and those bodies
 * are often exactly the working context the next turn needs (the file it was
 * mid-edit on, the config it was reasoning about). Re-reading them costs a tool
 * round-trip and, worse, the model may not realize it needs to.
 *
 * **Post-compact rehydration** softens that cliff: after the slice is dropped,
 * it scans the *dropped* messages for `read` results, takes the most-recent
 * handful that aren't already visible in the kept tail, and re-attaches their
 * bodies as synthetic user messages ("[Restored file after compaction] …") under
 * a token budget. The model keeps its working files without a re-read, while the
 * older surrounding chatter still gets compressed away.
 *
 * Shape note (this rebuild): a read's *body* lives in its own top-level
 * {@link ToolResultMessage} (`role:'toolResult'`), and the read's *path* lives in
 * the owning assistant `toolCall.arguments.path` (the read tool's arg is `path`,
 * not `file_path`). We pair each dropped `read` call with its result by
 * `toolCallId`, dedup against paths still visible in the kept tail, and emit the
 * most-recent survivors under a token cap.
 *
 * Behavior-preserving by construction: returns an empty array whenever there is
 * nothing to restore (no dropped reads, all already visible, or the budget is
 * exhausted), so the caller can splice the result unconditionally.
 */
import type { AgentMessage } from "./contract.js";
/** Prefix marking a synthetic message that restores a file body post-compaction. */
export declare const RESTORED_FILE_PREFIX = "[Restored file after compaction]";
/**
 * Build the synthetic user messages that re-attach the most-recently-read files
 * dropped by a condense.
 *
 * Scans `dropped` for `read` calls + result bodies, drops any path still visible
 * in `kept`, sorts the survivors most-recent-first, takes up to `maxFiles`, and
 * emits each as a `user` message of the form
 * `"[Restored file after compaction] <path>\n<body>"` — stopping once the running
 * token estimate would exceed `tokenBudget`. The returned messages are ordered
 * oldest-restored-first so they read naturally when spliced after the summary.
 *
 * Returns an **empty array** when nothing is restorable, so the caller can splice
 * the result unconditionally (`[summary, ...restored, ...kept]`).
 *
 * @param dropped the condensed-away head slice (original bodies, pre-summary)
 * @param kept    the verbatim tail that survives the condense
 * @param opts.maxFiles    cap on restored files (default {@link DEFAULT_MAX_FILES})
 * @param opts.tokenBudget token ceiling for the restored block (default {@link DEFAULT_TOKEN_BUDGET})
 * @param opts.readToolName wire name of the read tool (default `"read"`)
 */
export declare function rehydrateRecentReads(dropped: AgentMessage[], kept: AgentMessage[], opts?: {
    maxFiles?: number;
    tokenBudget?: number;
    readToolName?: string;
}): AgentMessage[];
