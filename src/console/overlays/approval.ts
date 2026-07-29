/**
 * Approval overlay — the interactive tool-permission prompt.
 */
import { Box, Text } from "indusagi/react-host/ink";
import { ThemeDialog, type ThemeDialogItem } from "indusagi/react-ink";
import { jsx, jsxs } from "indusagi/react-host/jsx-runtime";
import type { ApprovalChoice } from "../../conductor/index.js";
import type { OverlayGroupProps } from "./pickers.js";

export interface ApprovalRequest {
  readonly toolName: string;
  readonly input: unknown;
  readonly suggestions?: readonly string[];
}

export interface ApprovalPayload {
  readonly request: ApprovalRequest;
  readonly resolve: (choice: ApprovalChoice) => void;
}

export const APPROVAL_CHOICES: readonly (ThemeDialogItem & { id: ApprovalChoice })[] = [
  { id: "allow-once", label: "Allow once", description: "run this one call" },
  {
    id: "allow-always",
    label: "Allow always",
    description: "run it and remember this action for the session"
  },
  { id: "deny", label: "Deny", description: "block this call" }
];

export const DISMISS_CHOICE: ApprovalChoice = "deny";

export function choiceFromId(id: string): ApprovalChoice {
  const match = APPROVAL_CHOICES.find((choice) => choice.id === id);
  return (match?.id ?? DISMISS_CHOICE) as ApprovalChoice;
}

export function readApprovalPayload(payload: unknown): ApprovalPayload | undefined {
  if (payload === null || typeof payload !== "object") return void 0;
  const bag = payload as any;
  if (typeof bag.resolve !== "function") return void 0;
  const request = bag.request;
  if (request === null || typeof request !== "object") return void 0;
  const req = request as any;
  if (typeof req.toolName !== "string") return void 0;
  const suggestions = Array.isArray(req.suggestions) ? req.suggestions.filter((s: unknown) => typeof s === "string") : void 0;
  return {
    request: {
      toolName: req.toolName,
      input: req.input,
      ...(suggestions !== void 0 && suggestions.length > 0 ? { suggestions } : {})
    },
    resolve: bag.resolve
  };
}

const ARG_PREVIEW_LIMIT = 200;

export function summarizeInput(input: unknown): string {
  let text: string;
  if (input === null || input === void 0) {
    text = "";
  } else if (typeof input === "string") {
    text = input;
  } else if (typeof input === "object") {
    const bag = input as any;
    if (typeof bag.command === "string") {
      text = bag.command;
    } else {
      try {
        text = JSON.stringify(bag);
      } catch {
        text = "[unserialisable arguments]";
      }
    }
  } else {
    text = String(input);
  }
  text = text.replace(/\s+/g, " ").trim();
  if (text.length > ARG_PREVIEW_LIMIT) {
    return `${text.slice(0, ARG_PREVIEW_LIMIT)}…`;
  }
  return text;
}

function ApprovalDialog(props: { payload: ApprovalPayload; closeModal: () => void }) {
  const { payload, closeModal } = props;
  const { request, resolve } = payload;
  let settled = false;
  const settle = (choice: ApprovalChoice) => {
    if (settled) return;
    settled = true;
    resolve(choice);
    closeModal();
  };
  const args = summarizeInput(request.input);
  const suggestion = request.suggestions?.[0];
  return jsxs(Box, {
    flexDirection: "column",
    children: [
      jsxs(Text, {
        children: ["Allow ", jsx(Text, { bold: true, children: request.toolName }), " to run?"]
      }),
      args.length > 0 ? jsx(Text, { dimColor: true, children: args }) : null,
      suggestion !== void 0
        ? jsxs(Text, {
            dimColor: true,
            children: ["Allow-always remembers: ", suggestion]
          })
        : null,
      jsx(ThemeDialog, {
        themes: APPROVAL_CHOICES.map((choice) => ({
          id: choice.id,
          label: choice.label,
          description: choice.description
        })),
        onSelect: (id: string) => settle(choiceFromId(id)),
        onClose: () => settle(DISMISS_CHOICE)
      })
    ]
  });
}

export function ApprovalOverlays(props: OverlayGroupProps) {
  const { modal, closeModal } = props;
  if (modal.kind !== "approval") return null;
  const payload = readApprovalPayload(modal.payload);
  if (payload === void 0) return null;
  return jsx(ApprovalDialog, { payload, closeModal });
}