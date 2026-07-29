/**
 * StatusBar — the bottom chrome strip of the console.
 */
import { Box, Text } from "indusagi/react-host/ink";
import { Footer, StatusLine, type InkThemeAdapter, type SessionSnapshot, type StatusMessage } from "indusagi/react-ink";
import { jsx, jsxs } from "indusagi/react-host/jsx-runtime";

function permissionBadge(mode: string): { label: string; color: string } {
  switch (mode) {
    case "acceptEdits":
      return { label: "accept-edits", color: "yellow" };
    case "bypass":
    case "bypassPermissions":
      return { label: "bypass-permissions", color: "red" };
    case "plan":
      return { label: "plan", color: "cyan" };
    case "default":
    default:
      return { label: "default", color: "gray" };
  }
}

export interface StatusBarProps {
  readonly theme: InkThemeAdapter;
  readonly snapshot: SessionSnapshot;
  readonly branch: string | null;
  readonly providerCount: number;
  readonly status?: StatusMessage;
  readonly permissionMode?: string;
}

export function StatusBar({ theme, snapshot, branch, providerCount, status, permissionMode }: StatusBarProps) {
  const badge = permissionMode !== void 0 ? permissionBadge(permissionMode) : null;
  return jsxs(Box, {
    flexDirection: "column",
    children: [
      jsx(StatusLine, { theme, snapshot, status, showBusyText: false }),
      badge !== null
        ? jsx(Box, {
            children: jsxs(Text, {
              color: badge.color,
              children: ["● permission: ", badge.label]
            })
          })
        : null,
      jsx(Footer, { theme, branch, snapshot, availableProviderCount: providerCount })
    ]
  });
}