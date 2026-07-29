/**
 * Composer — the prompt-input surface.
 */
import { Box, Text } from "indusagi/react-host/ink";
import { jsx, jsxs } from "indusagi/react-host/jsx-runtime";
import type { InkThemeAdapter } from "indusagi/react-ink";
import type { Suggestion } from "../input/index.js";

const PROMPT_GLYPH = "› ";
const SUGGESTION_WINDOW = 8;
const NAME_COLUMN_CAP = 24;
const NAME_COLUMN_FLOOR = 8;

function clampName(label: string, width: number): string {
  if (label.length <= width) return label;
  if (width <= 1) return label.slice(0, width);
  return `${label.slice(0, width - 1)}…`;
}

function bufferWithCaret(buffer: string, caret: number) {
  const before = buffer.slice(0, caret);
  const under = caret < buffer.length ? buffer[caret] : " ";
  const after = caret < buffer.length ? buffer.slice(caret + 1) : "";
  return jsxs(Text, {
    children: [before, jsx(Text, { inverse: true, children: under }), after]
  });
}

export interface ComposerProps {
  readonly theme: InkThemeAdapter;
  readonly buffer: string;
  readonly caret: number;
  readonly busy: boolean;
  readonly suggestions: readonly Suggestion[];
  readonly highlight: number;
}

export function Composer({ theme, buffer, caret, busy, suggestions, highlight }: ComposerProps) {
  const shown = suggestions.slice(0, SUGGESTION_WINDOW);
  const borderColor = theme.colors.borderMuted ?? theme.colors.accent ?? "gray";
  const nameWidth = shown.length > 0
    ? Math.max(NAME_COLUMN_FLOOR, Math.min(NAME_COLUMN_CAP, Math.max(...shown.map((s) => s.label.length))))
    : 0;
  return jsxs(Box, {
    flexDirection: "column",
    children: [
      jsxs(Box, {
        borderStyle: "round",
        borderColor,
        paddingX: 1,
        children: [
          jsxs(Box, {
            flexGrow: 1,
            children: [
              jsx(Text, { children: theme.color("customMessage", PROMPT_GLYPH) }),
              bufferWithCaret(buffer, caret)
            ]
          }),
          jsx(Text, { children: theme.dim("↵ send") })
        ]
      }),
      shown.length > 0
        ? jsx(Box, {
            flexDirection: "column",
            marginTop: 1,
            children: shown.map((suggestion, index) => {
              const active = index === highlight;
              const name = clampName(suggestion.label, nameWidth);
              return jsxs(
                Box,
                {
                  children: [
                    jsx(Box, {
                      width: 2,
                      flexShrink: 0,
                      children: jsx(Text, { children: active ? theme.color("accent", "▸") : " " })
                    }),
                    jsx(Box, {
                      width: nameWidth,
                      flexShrink: 0,
                      children: jsx(Text, { bold: active, children: theme.color("customMessage", name) })
                    }),
                    jsx(Text, { children: "  " }),
                    jsx(Text, { children: theme.muted(suggestion.detail) })
                  ]
                },
                suggestion.value
              );
            })
          })
        : null
    ]
  });
}