// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Overlays subsystem — public barrel.
 *
 * Re-exports the single overlay mount point ({@link OverlayHost}) plus the three
 * group components it forwards to ({@link PickerOverlays}, {@link SessionOverlays},
 * {@link AuthOverlays}) and the shared prop shapes. The console surface imports
 * the overlay host from `src/console/overlays` rather than reaching into the
 * individual modules; the dialog bodies are filled by a later pass.
 */
export { OverlayHost, type OverlayHostProps } from "./host";
export { PickerOverlays, type OverlayGroupProps } from "./pickers";
export { SessionOverlays } from "./sessions";
export { AuthOverlays } from "./auth";
export { ApprovalOverlays, choiceFromId, readApprovalPayload, summarizeInput, APPROVAL_CHOICES, DISMISS_CHOICE, type ApprovalRequest, type ApprovalPayload, } from "./approval";
export { approvalQueueReducer, activeApproval, modeReleasesApprovals, EMPTY_APPROVAL_QUEUE, type ApprovalEntry, type ApprovalQueueState, type ApprovalQueueEvent, } from "./approval-queue";
