/**
 * Overlays subsystem — public barrel.
 */
export { OverlayHost, type OverlayHostProps } from "./host.js";
export { PickerOverlays, type OverlayGroupProps } from "./pickers.js";
export { SessionOverlays } from "./sessions.js";
export { AuthOverlays } from "./auth.js";
export {
  ApprovalOverlays,
  choiceFromId,
  readApprovalPayload,
  summarizeInput,
  APPROVAL_CHOICES,
  DISMISS_CHOICE,
  type ApprovalRequest,
  type ApprovalPayload
} from "./approval.js";
export {
  approvalQueueReducer,
  activeApproval,
  modeReleasesApprovals,
  EMPTY_APPROVAL_QUEUE,
  type ApprovalEntry,
  type ApprovalQueueState,
  type ApprovalQueueEvent
} from "./approval-queue.js";