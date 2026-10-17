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

import { Box, Text, useInput } from "indusagi/react-host/ink";

function UnavailableOverlay({ closeModal }: { closeModal: () => void }) {
  useInput((_input, key) => { if (key.escape || key.return) closeModal(); });
  return jsx(Box, {children: jsx(Text, {children: "This dialog is unavailable in this host. Esc / Enter to return."})});
}

export function OverlayHost(props: OverlayHostProps) {
  if (props.modal.kind === "none") return null;
  if (!props.services && props.modal.kind !== "approval" && props.modal.kind !== "plugin") {
    return jsx(UnavailableOverlay, {closeModal: props.closeModal});
  }
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