/**
 * OverlayHost — the single mount point for every modal overlay.
 */
import { Fragment, jsx, jsxs } from "indusagi/react-host/jsx-runtime";
import type { ConsoleDispatch, InkThemeAdapter, ModalState, OverlayServices } from "../contract.js";
import { PickerOverlays } from "./pickers.js";
import { SessionOverlays } from "./sessions.js";
import { AuthOverlays } from "./auth.js";
import { ApprovalOverlays } from "./approval.js";

export interface OverlayHostProps {
  readonly modal: ModalState;
  readonly services?: OverlayServices;
  readonly theme: InkThemeAdapter;
  readonly dispatch: ConsoleDispatch;
  readonly closeModal: () => void;
}

export function OverlayHost(props: OverlayHostProps) {
  if (props.modal.kind === "none") return null;
  const forwarded = {
    modal: props.modal,
    services: props.services,
    theme: props.theme,
    dispatch: props.dispatch,
    closeModal: props.closeModal
  };
  return jsxs(Fragment, {
    children: [
      jsx(PickerOverlays, { ...forwarded }),
      jsx(SessionOverlays, { ...forwarded }),
      jsx(AuthOverlays, { ...forwarded }),
      jsx(ApprovalOverlays, { ...forwarded })
    ]
  });
}