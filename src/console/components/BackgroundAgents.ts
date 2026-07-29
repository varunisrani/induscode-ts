/**
 * BackgroundAgents — the live sub-agent panel pinned below the input.
 */
import { Box, Text } from "indusagi/react-host/ink";
import { splitAssistantMessage, type InkThemeAdapter } from "indusagi/react-ink";
import { jsx, jsxs } from "indusagi/react-host/jsx-runtime";
import type { AgentMessage } from "indusagi/agent";

/** The live status of one delegated sub-agent. */
export type AgentRunStatus = "running" | "done" | "error";

/** One delegated sub-agent run, projected from the conversation. */
export interface AgentRun {
  readonly id: string;
  readonly name: string;
  readonly objective: string;
  readonly status: AgentRunStatus;
  readonly startedAt: number;
}

function readString(args: any, key: string): string | undefined {
  const value = args[key];
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}

/**
 * Derive the delegated sub-agent runs from the conversation.
 */
export function deriveAgentRuns(messages: readonly AgentMessage[]): AgentRun[] {
  const runs: AgentRun[] = [];
  const status = new Map<string, AgentRunStatus>();
  for (const message of messages) {
    if (message.role === "assistant") {
      const { toolCalls } = splitAssistantMessage(message as any, false);
      for (const call of toolCalls) {
        if (call.name !== "task") continue;
        const args = call.arguments && typeof call.arguments === "object" ? call.arguments : {};
        runs.push({
          id: call.id,
          name: readString(args, "agent") ?? "subagent",
          objective: readString(args, "objective") ?? "",
          status: "running",
          startedAt: typeof message.timestamp === "number" ? message.timestamp : 0
        });
      }
      continue;
    }
    if (message.role === "toolResult") {
      const result = message as any;
      if (typeof result.toolCallId === "string") {
        status.set(result.toolCallId, result.isError ? "error" : "done");
      }
    }
  }
  return runs.map((run) => ({ ...run, status: status.get(run.id) ?? run.status }));
}

const MAX_VISIBLE_RUNS = 8;
const NAME_WIDTH = 12;

function clamp(text: string, width: number): string {
  if (text.length <= width) return text;
  if (width <= 1) return text.slice(0, width);
  return `${text.slice(0, width - 1)}…`;
}

const OBJECTIVE_WIDTH = 64;

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function formatTokens(tokens: number): string {
  if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}k`;
  return String(tokens);
}

function statusText(run: AgentRun, now: number, tokens?: number): string {
  let head: string;
  if (run.status === "error") head = "failed";
  else if (run.status === "done") head = "done";
  else if (run.startedAt > 0 && now >= run.startedAt) {
    head = `${Math.max(0, Math.round((now - run.startedAt) / 1e3))}s`;
  } else head = "running";
  if (tokens !== void 0 && tokens > 0) {
    return `${head}  ·  ↓ ${formatTokens(tokens)} tokens`;
  }
  return head;
}

export interface BackgroundAgentsProps {
  readonly theme: InkThemeAdapter;
  readonly runs: readonly AgentRun[];
  readonly tokens?: Readonly<Record<string, number>>;
  readonly now?: number;
}

/**
 * Render the background-agents panel, or nothing when no run is in flight.
 */
export function BackgroundAgents({ theme, runs, tokens, now }: BackgroundAgentsProps) {
  const clock = now ?? Date.now();
  const runningCount = runs.reduce((n, run) => (run.status === "running" ? n + 1 : n), 0);
  if (runningCount === 0) return null;
  const visible = runs.slice(-MAX_VISIBLE_RUNS);
  return jsxs(Box, {
    flexDirection: "column",
    marginTop: 1,
    children: [
      jsxs(Box, {
        children: [
          jsx(Text, { children: theme.color("text", "● ") }),
          jsx(Text, { bold: true, children: theme.color("text", "main") })
        ]
      }),
      visible.map((run) => {
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
              jsx(Box, { width: 2, flexShrink: 0, children: jsx(Text, { children: dot }) }),
              jsx(Box, {
                width: NAME_WIDTH,
                flexShrink: 0,
                children: jsx(Text, { bold: true, children: theme.color("accent", clamp(run.name, NAME_WIDTH - 1)) })
              }),
              jsx(Box, {
                flexGrow: 1,
                flexShrink: 1,
                children: jsx(Text, { wrap: "truncate", children: theme.muted(clamp(oneLine(run.objective), OBJECTIVE_WIDTH)) })
              }),
              jsx(Text, { children: theme.dim(`  ${statusText(run, clock, tokens?.[run.id])}`) })
            ]
          },
          run.id
        );
      }),
      jsxs(Box, {
        marginTop: 1,
        children: [
          jsx(Text, { children: theme.color("accent", "✶ ") }),
          jsx(Text, { children: theme.muted(`Waiting for ${runningCount} background agent${runningCount === 1 ? "" : "s"} to finish`) })
        ]
      })
    ]
  });
}