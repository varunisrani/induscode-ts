/**
 * AgentsView — the drill-in sub-agent view.
 */
import { useState } from "indusagi/react-host";
import { Box, Text, useInput } from "indusagi/react-host/ink";
import { wrapSelectionIndex, type InkThemeAdapter } from "indusagi/react-ink";
import { jsx, jsxs } from "indusagi/react-host/jsx-runtime";
import { useAgentClock, type AgentRun } from "./BackgroundAgents.js";

function formatTokens(tokens: number): string {
  return tokens >= 1e3 ? `${(tokens / 1e3).toFixed(1)}k` : String(tokens);
}

function clampLine(text: string, width: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= width) return flat;
  if (width <= 1) return flat.slice(0, width);
  return `${flat.slice(0, width - 1)}…`;
}

interface ActivityLine {
  tone: "tool" | "result" | "info";
  text: string;
}

function runStatusLine(run: AgentRun, now: number, tokens?: number): string {
  let head: string;
  if (run.status === "error") head = "failed";
  else if (run.status === "done") head = "done";
  else if (run.startedAt > 0 && now >= run.startedAt) {
    head = `${Math.max(0, Math.round((now - run.startedAt) / 1e3))}s`;
  } else head = "working";
  const tok = tokens !== void 0 && tokens > 0 ? `  ·  ↓ ${formatTokens(tokens)} tokens` : "";
  return `${head}${tok}`;
}

const NAME_WIDTH = 12;

function ActivityRow({ theme, line }: { theme: InkThemeAdapter; line: ActivityLine }) {
  if (line.tone === "tool") {
    return jsxs(Box, {
      children: [
        jsx(Text, { children: theme.color("success", "● ") }),
        jsx(Text, { children: theme.color("text", clampLine(line.text, 96)) })
      ]
    });
  }
  if (line.tone === "result") {
    return jsx(Box, { marginLeft: 2, children: jsx(Text, { children: theme.dim(`└ ${clampLine(line.text, 92)}`) }) });
  }
  return jsxs(Box, {
    children: [
      jsx(Text, { children: theme.color("accent", "● ") }),
      jsx(Text, { children: theme.color("text", clampLine(line.text, 96)) })
    ]
  });
}

export interface AgentsViewProps {
  readonly theme: InkThemeAdapter;
  readonly runs: readonly AgentRun[];
  readonly activity: Readonly<Record<string, readonly ActivityLine[]>>;
  readonly tokens: Readonly<Record<string, number>>;
  readonly now?: number;
  readonly onExit: () => void;
}

export function AgentsView({ theme, runs, activity, tokens, now, onExit }: AgentsViewProps) {
  const clock = useAgentClock(runs.some(run => run.status === "running"), now);
  const [selectedIndex, setSelectedIndex] = useState(runs.length > 0 ? 1 : 0);
  const rowCount = runs.length + 1;
  const index = Math.min(selectedIndex, rowCount - 1);
  const viewed = index > 0 ? runs[index - 1] : void 0;
  useInput((input, key) => {
    if (key.escape || input === "x") return onExit();
    if (key.upArrow) return setSelectedIndex((i) => wrapSelectionIndex(Math.min(i, rowCount - 1), -1, rowCount));
    if (key.downArrow) return setSelectedIndex((i) => wrapSelectionIndex(Math.min(i, rowCount - 1), 1, rowCount));
    if (key.return && index === 0) onExit();
  });
  const lines = viewed ? activity[viewed.id] ?? [] : [];
  return jsxs(Box, {
    flexDirection: "column",
    marginTop: 1,
    children: [
      viewed
        ? jsxs(Box, {
            flexDirection: "column",
            children: [
              jsxs(Box, {
                marginBottom: 1,
                children: [
                  jsx(Text, { children: theme.color("accent", "✶ ") }),
                  jsx(Text, { bold: true, children: theme.color("accent", viewed.name) }),
                  jsx(Text, { children: theme.dim(`  ${runStatusLine(viewed, clock, tokens[viewed.id])}`) })
                ]
              }),
              lines.length === 0
                ? jsx(Text, { children: theme.muted("  Waiting for the first step…") })
                : lines.map((line, i) => jsx(ActivityRow, { theme, line }, i)),
              jsx(Box, {
                marginTop: 1,
                children: jsx(Text, { wrap: "truncate", children: theme.muted(`└ ${clampLine(viewed.objective, 100)}`) })
              })
            ]
          })
        : jsxs(Box, {
            children: [
              jsx(Text, { children: theme.muted("Select a sub-agent to view its live activity, or press Enter on ") }),
              jsx(Text, { bold: true, children: theme.color("text", "main") }),
              jsx(Text, { children: theme.muted(" to return.") })
            ]
          }),
      jsxs(Box, {
        flexDirection: "column",
        marginTop: 1,
        borderStyle: "single",
        borderColor: theme.colors["borderMuted"],
        borderBottom: false,
        borderLeft: false,
        borderRight: false,
        paddingTop: 0,
        children: [
          jsxs(Box, {
            children: [
              jsx(Text, { children: index === 0 ? theme.color("accent", "› ") : "  " }),
              jsx(Text, { children: index === 0 ? theme.color("text", "● ") : theme.dim("○ ") }),
              jsx(Text, { bold: index === 0, children: theme.color("text", "main") })
            ]
          }),
          runs.map((run, i) => {
            const selected = index === i + 1;
            const dot =
              run.status === "running"
                ? theme.color("accent", "◐")
                : run.status === "error"
                ? theme.color("error", "●")
                : theme.color("success", "●");
            return jsxs(
              Box,
              {
                children: [
                  jsx(Text, { children: selected ? theme.color("accent", "› ") : "  " }),
                  jsx(Box, { width: 2, flexShrink: 0, children: jsx(Text, { children: dot }) }),
                  jsx(Box, {
                    width: NAME_WIDTH,
                    flexShrink: 0,
                    children: jsx(Text, { bold: selected, children: theme.color("accent", clampLine(run.name, NAME_WIDTH - 1)) })
                  }),
                  jsx(Box, {
                    flexGrow: 1,
                    flexShrink: 1,
                    children: jsx(Text, { wrap: "truncate", children: theme.muted(clampLine(run.objective, 56)) })
                  }),
                  jsx(Text, { children: theme.dim(`  ${runStatusLine(run, clock, tokens[run.id])}`) })
                ]
              },
              run.id
            );
          })
        ]
      }),
      jsx(Box, { marginTop: 1, children: jsx(Text, { children: theme.dim("↑/↓ select  ·  Enter to view  ·  Enter on main / Esc to return") }) })
    ]
  });
}