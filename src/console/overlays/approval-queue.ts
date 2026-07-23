// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Approval queue — the headless, pure serializer behind the approval overlay.
 *
 * The permission gate may reach an `ask` decision while another approval prompt is
 * already on screen (e.g. a turn that batches several tool calls). The UI shows ONE
 * prompt at a time, so the pending requests are held in an ordered queue: each
 * `enqueue` parks a request, the HEAD is the prompt currently shown, and `settle`
 * resolves the head's parked promise then advances to the next. This module is a
 * pure reducer over an immutable {@link ApprovalQueueState} plus a couple of tiny
 * helpers — no React, no Ink, no timers — so the queue logic is unit-testable in
 * isolation (the overlay component only renders the head and dispatches settles).
 *
 * Each queued entry carries the parked promise's `resolve` (the gate awaits it) and
 * the request itself. Settling resolves with an {@link ApprovalChoice}; an
 * abort/clear settles every outstanding entry with `"deny"` so a cancelled turn
 * never hangs on a pending prompt.
 */
import type { ApprovalChoice, PermissionMode } from "../../conductor";
import type { ApprovalRequest } from "./approval";
/** One parked approval request awaiting the user's choice. */
export interface ApprovalEntry {
    /** A stable id, unique within the queue's lifetime, used to settle the right one. */
    readonly id: string;
    /** The pending request the prompt renders. */
    readonly request: ApprovalRequest;
    /** Fulfil the gate's parked promise with the user's choice. Called exactly once. */
    readonly resolve: (choice: ApprovalChoice) => void;
}
/**
 * The immutable queue state. The array is ordered oldest-first; the head (index 0)
 * is the request currently prompted. An empty queue means no prompt is showing.
 */
export interface ApprovalQueueState {
    /** The parked entries, oldest first; `[0]` is the active prompt. */
    readonly entries: readonly ApprovalEntry[];
}
/** The empty queue — no approval prompt pending. */
export declare const EMPTY_APPROVAL_QUEUE: ApprovalQueueState;
/**
 * The closed action union the queue reducer folds:
 *   - `enqueue` — park a new request at the tail.
 *   - `settle`  — resolve the entry matching `id` with `choice` and drop it.
 *   - `clear`   — drop EVERY entry (the caller resolves each with `"deny"`).
 */
export type ApprovalQueueEvent = {
    readonly type: "enqueue";
    readonly entry: ApprovalEntry;
} | {
    readonly type: "settle";
    readonly id: string;
} | {
    readonly type: "clear";
};
/**
 * Fold one {@link ApprovalQueueEvent} over the queue, returning a fresh state.
 *
 * Pure and total: it never resolves a promise itself (the caller does that around
 * a `settle`/`clear`), it only mutates the ordered entry list. `enqueue` appends;
 * `settle` removes the entry with the matching `id` (a no-op when absent, e.g. a
 * double-settle); `clear` empties the queue.
 *
 * @param state the prior queue state
 * @param event the action to apply
 */
export declare function approvalQueueReducer(state: ApprovalQueueState, event: ApprovalQueueEvent): ApprovalQueueState;
/**
 * The active prompt — the head entry — or `undefined` when the queue is empty.
 *
 * @param state the queue state
 */
export declare function activeApproval(state: ApprovalQueueState): ApprovalEntry | undefined;
/**
 * Whether switching INTO `mode` mid-prompt should release (auto-allow) every
 * PARKED approval request.
 *
 * Only `bypass` qualifies: a parked entry already passed the deny-rule and
 * catastrophic-blocklist scans before it reached `ask`, and under bypass the
 * engine allows everything not denied — so settling the parked prompts with
 * `allow-once` matches exactly what the mode now means, and the run resumes
 * instead of idling behind a prompt the user just declared moot. Every other
 * mode keeps the prompts parked: `default`/`acceptEdits` still want the answer,
 * and `plan` must not auto-ALLOW a mutating call (the user can still deny).
 *
 * Pure; the component wires it to the actual settle.
 *
 * @param mode the permission mode just switched into
 */
export declare function modeReleasesApprovals(mode: PermissionMode): boolean;
