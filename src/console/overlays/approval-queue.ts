/**
 * Approval queue — the headless, pure serializer behind the approval overlay.
 */
import type { ApprovalChoice, PermissionMode } from "../../conductor/index.js";
import type { ApprovalRequest } from "./approval.js";

/** One parked approval request awaiting the user's choice. */
export interface ApprovalEntry {
  readonly id: string;
  readonly request: ApprovalRequest;
  readonly resolve: (choice: ApprovalChoice) => void;
}

/** The immutable queue state. */
export interface ApprovalQueueState {
  readonly entries: readonly ApprovalEntry[];
}

/** The empty queue — no approval prompt pending. */
export const EMPTY_APPROVAL_QUEUE: ApprovalQueueState = { entries: [] };

export type ApprovalQueueEvent =
  | { readonly type: "enqueue"; readonly entry: ApprovalEntry }
  | { readonly type: "settle"; readonly id: string }
  | { readonly type: "clear" };

/**
 * Fold one {@link ApprovalQueueEvent} over the queue, returning a fresh state.
 */
export function approvalQueueReducer(state: ApprovalQueueState, event: ApprovalQueueEvent): ApprovalQueueState {
  switch (event.type) {
    case "enqueue":
      return { entries: [...state.entries, event.entry] };
    case "settle": {
      const next = state.entries.filter((entry) => entry.id !== event.id);
      return next.length === state.entries.length ? state : { entries: next };
    }
    case "clear":
      return state.entries.length === 0 ? state : EMPTY_APPROVAL_QUEUE;
    default:
      return state;
  }
}

/**
 * The active prompt — the head entry — or `undefined` when the queue is empty.
 */
export function activeApproval(state: ApprovalQueueState): ApprovalEntry | undefined {
  return state.entries[0];
}

/**
 * Whether switching INTO `mode` mid-prompt should release every PARKED approval request.
 */
export function modeReleasesApprovals(mode: PermissionMode): boolean {
  return mode === "bypass" || mode === "bypassPermissions";
}