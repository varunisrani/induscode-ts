/**
 * TerminalConsole — the top-level Ink application for the interactive console.
 */
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import React, { useEffect, useMemo, useState } from "indusagi/react-host";
import { Box, Text, useInput } from "indusagi/react-host/ink";
import { MessageList, StreamingMarkdown, TaskPanel, type InkThemeAdapter } from "indusagi/react-ink";
import { Fragment, jsx, jsxs } from "indusagi/react-host/jsx-runtime";
import { VERSION } from "../../index.js";
import {
  RESTORED_FILE_PREFIX,
  allowAlwaysRuleStrings,
  readClipboardImage,
  openInExternalEditor
} from "../../conductor/index.js";
import { consoleReducer, initConsoleState } from "../reducer.js";
import {
  advanceChord,
  applySuggestion,
  completeAt,
  coalescePaste,
  appendToPaste,
  classifyPaste,
  createDirReader,
  expandMarkers,
  hasMarkers,
  NO_CHORD,
  NO_INTENT,
  pasteLines,
  EMPTY_PASTE_VAULT,
  PASTE_BURST_GAP_MS,
  PASTE_CONTINUATION_MS,
  PASTE_MARKER_LINE_CAP,
  readKey,
} from "../input/index.js";
import { resolveSlash } from "../slash/index.js";
import {
  activeApproval,
  approvalQueueReducer,
  EMPTY_APPROVAL_QUEUE,
  modeReleasesApprovals
} from "../overlays/approval-queue.js";
import type { ConsoleProps } from "../contract.js";
import { OverlayHost } from "../overlays/host.js";
import { useAuthenticatedProviders } from "../auth-status.js";
import { gatherStartup } from "../startup.js";
import { PINNED_WELCOME_SEED } from "./welcome.js";
import { AgentsView } from "./AgentsView.js";
import { BackgroundAgents, deriveAgentRuns } from "./BackgroundAgents.js";
import { Banner } from "./Banner.js";
import { Composer } from "./Composer.js";
import { StatusBar } from "./StatusBar.js";
import { WorkingIndicator } from "./WorkingIndicator.js";

const { useReducer, useRef, useCallback } = React;

const CHORD_WINDOW_MS = 600;
const CTRL_C_EXIT_WINDOW_MS = 500;
const FALLBACK_TERMINAL_ROWS = 40;
const CHROME_ROWS = 14;
const MODAL_CHROME_ROWS = 24;
const MIN_VISIBLE_ROWS = 8;
const FALLBACK_CONTEXT_WINDOW = 200000;
const PASTE_BURST_MS = PASTE_BURST_GAP_MS;
const BRACKETED_PASTE = /\x1b?\[20[01]~/g;

interface ActivePaste {
  ordinal: number;
  marker: string;
  until: number;
}

interface ReadBranchResult {
  branch: string | null;
}

function readBranch(): string | null {
  try {
    const out = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

function writeTerminalTitle(title: string) {
  if (!process.stdout.isTTY) return;
  process.stdout.write(`\x1B]2;${title}\x07`);
}

function projectSnapshot(conductor: any, messages: any[], services: any) {
  const snap = conductor.snapshot();
  const model = conductor.model();
  const contextWindow = model && model.contextWindow > 0 ? model.contextWindow : FALLBACK_CONTEXT_WINDOW;
  const usedTokens = snap.contextTokens;
  const percent = contextWindow > 0 ? (usedTokens / contextWindow) * 100 : 0;
  const stats = conductor.stats();
  const pending = conductor.pendingCount();
  let autoCompactEnabled = true;
  if (services) {
    try {
      autoCompactEnabled = services.settings.get("autoCompact");
    } catch {
      autoCompactEnabled = true;
    }
  }
  return {
    messages,
    model,
    thinkingLevel: conductor.thinkingLevel(),
    contextUsage: {
      tokens: usedTokens,
      contextWindow,
      percent
    },
    isStreaming: snap.phase === "streaming",
    isCompacting: snap.phase === "condensing",
    isBashRunning: snap.phase === "tooling",
    pendingMessageCount: pending,
    pendingToolCallCount: 0,
    sessionId: snap.head.sessionId,
    sessionFile: void 0,
    sessionName: conductor.sessionName(),
    cwd: process.cwd(),
    autoCompactEnabled,
    leafId: snap.head.leaf,
    stats: {
      sessionId: stats.sessionId,
      userMessages: stats.userMessages,
      assistantMessages: stats.assistantMessages,
      toolCalls: stats.toolCalls,
      toolResults: stats.toolResults,
      totalMessages: stats.totalMessages,
      tokens: {
        input: stats.tokens.input,
        output: stats.tokens.output,
        cacheRead: stats.tokens.cacheRead,
        cacheWrite: stats.tokens.cacheWrite,
        total: stats.tokens.total
      },
      cost: stats.cost
    }
  };
}

function transcriptHeight(rows: number, modalOpen: boolean, extraReserved = 0): number {
  const reserved = (modalOpen ? MODAL_CHROME_ROWS : CHROME_ROWS) + Math.max(0, extraReserved);
  return Math.max(MIN_VISIBLE_ROWS, rows - reserved);
}

function agentPanelRows(runs: any[]): number {
  const running = runs.reduce((n, run) => (run.status === "running" ? n + 1 : n), 0);
  if (running === 0) return 0;
  const AGENT_PANEL_VISIBLE_CAP = 8;
  return 4 + Math.min(runs.length, AGENT_PANEL_VISIBLE_CAP);
}

function countProviders(conductor: any): number {
  const seen = new Set<string>();
  for (const card of conductor.availableModels()) seen.add(card.provider);
  return seen.size;
}

function readDoubleEscapeAction(services: any): string {
  if (!services) return "clear";
  let raw: unknown;
  try {
    raw = services.settings.get("doubleEscapeAction");
  } catch {
    return "clear";
  }
  switch (raw) {
    case "tree":
    case "branch":
      return "tree";
    case "fork":
    case "rewind":
      return "fork";
    default:
      return "clear";
  }
}

function freshRowId(seed: number): string {
  return `row-${seed.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function renderToolUpdateText(details: any): string | undefined {
  if (details === null || typeof details !== "object") return void 0;
  if ("agents" in details && Array.isArray(details.agents)) {
    return renderWorkflowText(details);
  }
  const text = details.text;
  return typeof text === "string" ? text : void 0;
}

function renderWorkflowText(details: any): string {
  const agents = details.agents;
  return Array.isArray(agents) ? agents.map((a: any) => `${a.name ?? "agent"}: ${a.label ?? ""}`).join(" · ") : "";
}

function permissionModeStatusText(mode: string): string {
  switch (mode) {
    case "plan":
      return "Permission mode: PLAN — read-only research; mutating tools are blocked. Shift+Tab to cycle.";
    case "bypass":
    case "bypassPermissions":
      return "Permission mode: BYPASS — every tool auto-allowed (unsafe). Shift+Tab to cycle.";
    case "acceptEdits":
      return "Permission mode: ACCEPT-EDITS — edits auto-approved. Shift+Tab to cycle.";
    default:
      return "Permission mode: DEFAULT — tools prompt as usual. Shift+Tab to cycle.";
  }
}

export function TerminalConsole(props: ConsoleProps) {
  const { conductor, theme, slash, verbose, onExit, initialInput, services } = props;
  const adapter = theme.adapter;
  const [state, dispatch] = useReducer(consoleReducer, initConsoleState({ scheme: theme.scheme }));
  const chord = useRef(NO_CHORD);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paste = useRef(EMPTY_PASTE_VAULT);
  const activePaste = useRef<ActivePaste | null>(null);
  const burst = useRef("");
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveAnswer = useRef<string | null>(null);
  const liveReason = useRef<string | null>(null);
  const rowSeed = useRef(0);
  const ctrlCAt = useRef(0);
  const [highlight, setHighlight] = useState(0);
  const [toolExecutions, setToolExecutions] = useState<Record<string, any>>({});
  const [taskTokens, setTaskTokens] = useState<Record<string, number>>({});
  const [subagentActivity, setSubagentActivity] = useState<Record<string, any[]>>({});
  const [expandTools, setExpandTools] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [terminalRows, setTerminalRows] = useState(() => process.stdout.rows ?? FALLBACK_TERMINAL_ROWS);
  const [, forceTick] = useState(0);
  const pulse = useCallback(() => forceTick((n) => n + 1), []);
  const dirReader = useMemo(() => createDirReader(process.cwd()), []);
  const [approvalQueue, dispatchApproval] = useReducer(approvalQueueReducer, EMPTY_APPROVAL_QUEUE);
  const approvalSeed = useRef(0);
  const approvalResolvers = useRef(new Map<string, (choice: any) => void>());
  const settleApproval = useCallback((id: string, choice: any) => {
    const resolve = approvalResolvers.current.get(id);
    if (resolve === void 0) return;
    approvalResolvers.current.delete(id);
    dispatchApproval({ type: "settle", id });
    resolve(choice);
  }, []);
  const denyAllApprovals = useCallback(() => {
    const pending = [...approvalResolvers.current.entries()];
    approvalResolvers.current.clear();
    dispatchApproval({ type: "clear" });
    for (const [, resolve] of pending) resolve("deny");
  }, []);
  const requestApproval = useCallback(
    (toolName: string, input: unknown, opts: { signal?: AbortSignal }) =>
      new Promise((resolve) => {
        approvalSeed.current += 1;
        const id = `ap_${approvalSeed.current}`;
        const request = {
          toolName,
          input,
          suggestions: allowAlwaysRuleStrings(toolName, input)
        };
        approvalResolvers.current.set(id, resolve);
        const signal = opts.signal;
        if (signal !== void 0) {
          if (signal.aborted) {
            approvalResolvers.current.delete(id);
            resolve("deny");
            return;
          }
          signal.addEventListener("abort", () => settleApproval(id, "deny"), { once: true });
        }
        dispatchApproval({ type: "enqueue", entry: { id, request, resolve } });
      }),
    [settleApproval]
  );
  useEffect(() => {
    conductor.setApprovalResolver(requestApproval);
    return () => {
      conductor.setApprovalResolver(void 0);
      denyAllApprovals();
    };
  }, [conductor, requestApproval, denyAllApprovals]);
  const head = activeApproval(approvalQueue);
  const headId = head?.id;
  const approvalModalOpen = useRef(false);
  useEffect(() => {
    if (head === void 0) {
      if (approvalModalOpen.current) {
        approvalModalOpen.current = false;
        dispatch({ type: "modal:close" });
      }
      return;
    }
    approvalModalOpen.current = true;
    dispatch({
      type: "modal:open",
      kind: "approval",
      payload: {
        request: head.request,
        resolve: (choice: any) => settleApproval(head.id, choice)
      }
    });
  }, [headId, settleApproval]);
  const cyclePermission = useCallback(() => {
    const now = conductor.cyclePermissionMode();
    let text = permissionModeStatusText(now);
    if (modeReleasesApprovals(now as any) && approvalResolvers.current.size > 0) {
      const parked = [...approvalResolvers.current.keys()];
      for (const id of parked) settleApproval(id, "allow-once");
      text += ` Released ${parked.length} pending approval${parked.length === 1 ? "" : "s"}.`;
    }
    dispatch({ type: "status:set", status: { kind: "info", text } });
  }, [conductor, settleApproval]);
  const answerText = useRef("");
  const reasonText = useRef("");
  const visibleFrom = useRef(0);
  const [compactNote, setCompactNote] = useState<string[] | null>(null);
  useEffect(() => {
    const off = conductor.subscribe((signal: any) => {
      switch (signal.kind) {
        case "prompt": {
          break;
        }
        case "text": {
          if (liveAnswer.current === null) {
            const id = freshRowId(rowSeed.current++);
            liveAnswer.current = id;
            answerText.current = signal.delta;
            dispatch({ type: "rows:append", row: { id, kind: "answer", text: answerText.current } });
          } else {
            answerText.current += signal.delta;
            dispatch({ type: "rows:patch", id: liveAnswer.current, text: answerText.current });
          }
          break;
        }
        case "thinking": {
          if (liveReason.current === null) {
            const id = freshRowId(rowSeed.current++);
            liveReason.current = id;
            reasonText.current = signal.delta;
            dispatch({ type: "rows:append", row: { id, kind: "reason", text: reasonText.current } });
          } else {
            reasonText.current += signal.delta;
            dispatch({ type: "rows:patch", id: liveReason.current, text: reasonText.current });
          }
          break;
        }
        case "tool_start": {
          liveAnswer.current = null;
          liveReason.current = null;
          const id = `tool-${signal.id}`;
          const row = { id, kind: "toolRun", text: signal.name, runId: signal.id };
          dispatch({ type: "rows:append", row });
          setToolExecutions((current) => ({
            ...current,
            [signal.id]: {
              toolCallId: signal.id,
              toolName: signal.name,
              argsText: "",
              status: "running",
              outputText: "",
              updatedAt: Date.now()
            }
          }));
          break;
        }
        case "tool_update": {
          const text = renderToolUpdateText(signal.details);
          if (text !== void 0) {
            setToolExecutions((current) => {
              const prior = current[signal.id];
              if (prior === void 0) return current;
              return {
                ...current,
                [signal.id]: { ...prior, outputText: text, updatedAt: Date.now() }
              };
            });
          }
          const details = signal.details;
          if (details !== null && typeof details === "object") {
            const tokens = details.tokens;
            if (typeof tokens === "number" && Number.isFinite(tokens)) {
              setTaskTokens((current) =>
                current[signal.id] === tokens ? current : { ...current, [signal.id]: tokens }
              );
            }
            const activity = details.activity;
            if (Array.isArray(activity)) {
              setSubagentActivity((current) => ({
                ...current,
                [signal.id]: activity
              }));
            }
          }
          break;
        }
        case "tool_end": {
          dispatch({
            type: "rows:patch",
            id: `tool-${signal.id}`,
            text: signal.ok ? "done" : "failed"
          });
          setToolExecutions((current) => {
            const prior = current[signal.id];
            if (prior === void 0) return current;
            return {
              ...current,
              [signal.id]: {
                ...prior,
                status: signal.ok ? "success" : "error",
                updatedAt: Date.now()
              }
            };
          });
          break;
        }
        case "turn_end": {
          liveAnswer.current = null;
          liveReason.current = null;
          dispatch({ type: "tick" });
          break;
        }
        case "compacted": {
          if (signal.manual) {
            const carried: string[] = [];
            for (const message of conductor.messages()) {
              const content = message.content;
              if (typeof content === "string" && content.startsWith(RESTORED_FILE_PREFIX)) {
                const firstLine = content.slice(RESTORED_FILE_PREFIX.length).split("\n", 1)[0];
                if (firstLine) carried.push(firstLine.trim());
              }
            }
            setCompactNote(carried);
            visibleFrom.current = conductor.messages().length;
            liveAnswer.current = null;
            liveReason.current = null;
            answerText.current = "";
            reasonText.current = "";
            dispatch({ type: "rows:set", rows: [] });
          }
          dispatch({
            type: "status:set",
            status: {
              kind: "info",
              text: signal.manual
                ? "Conversation condensed."
                : "Auto-compacted older history to stay within the context window (automatic — you didn't run /compact)."
            }
          });
          break;
        }
        case "persisted": {
          dispatch({ type: "tick" });
          break;
        }
        case "fault": {
          if (signal.transient) {
            dispatch({ type: "status:set", status: { kind: "warning", text: signal.fault.message } });
            break;
          }
          liveAnswer.current = null;
          liveReason.current = null;
          dispatch({ type: "busy:set", busy: false });
          dispatch({ type: "status:set", status: { kind: "error", text: signal.fault.message } });
          break;
        }
        case "idle": {
          dispatch({ type: "busy:set", busy: false });
          break;
        }
        default:
          break;
      }
      pulse();
    });
    return off;
  }, [conductor, pulse]);
  const completion = useMemo(
    () => completeAt(state.buffer, state.caret, slash, dirReader),
    [state.buffer, state.caret, slash, dirReader]
  );
  const suggestions = completion.suggestions;
  useEffect(() => {
    if (highlight >= suggestions.length) setHighlight(0);
  }, [suggestions.length, highlight]);
  const runTurn = useCallback(
    async (text: string) => {
      const id = freshRowId(rowSeed.current++);
      dispatch({ type: "rows:append", row: { id, kind: "prompt", text } });
      dispatch({ type: "busy:set", busy: true });
      if (conductor.snapshot().phase === "condensing") {
        dispatch({
          type: "status:set",
          status: { kind: "info", text: "Queued message for after compaction." }
        });
      }
      setCompactNote(null);
      activePaste.current = null;
      answerText.current = "";
      reasonText.current = "";
      try {
        await conductor.submit(text);
      } catch (err) {
        dispatch({ type: "busy:set", busy: false });
        dispatch({
          type: "status:set",
          status: { kind: "error", text: err instanceof Error ? err.message : String(err) }
        });
      }
      pulse();
    },
    [conductor, pulse]
  );
  const submit = useCallback(
    (raw: string) => {
      const text = hasMarkers(raw, paste.current) ? expandMarkers(raw, paste.current) : raw;
      const trimmed = text.trim();
      dispatch({ type: "buffer:set", text: "" });
      paste.current = EMPTY_PASTE_VAULT;
      if (trimmed.length === 0) return;
      dispatch({ type: "history:push", text: raw });
      if (trimmed.startsWith("!")) {
        const excludeFromContext = trimmed.startsWith("!!");
        const command = trimmed.slice(excludeFromContext ? 2 : 1).trim();
        if (command.length === 0) return;
        dispatch({ type: "status:set", status: { kind: "busy", text: `Running: ${command}` } });
        void conductor
          .executeBash(command, { excludeFromContext })
          .then((outcome: any) => {
            dispatch({
              type: "status:set",
              status: {
                kind: outcome.exitCode === 0 ? "info" : "error",
                text: `Shell exited ${outcome.exitCode}.`
              }
            });
          })
          .catch((err) => {
            dispatch({
              type: "status:set",
              status: { kind: "error", text: err instanceof Error ? err.message : String(err) }
            });
          });
        return;
      }
      const resolution = resolveSlash(trimmed, slash);
      if (resolution.kind === "match") {
        const outcome = resolution.command.run({
          args: resolution.args,
          conductor,
          dispatch,
          openModal: (kind, payload) => dispatch({ type: "modal:open", kind, payload }),
          closeModal: () => dispatch({ type: "modal:close" }),
          requestExit: () => onExit?.(),
          setStatus: (status) => dispatch({ type: "status:set", status }),
          setBuffer: (value) => dispatch({ type: "buffer:set", text: value }),
          appendBlock: (block) => dispatch({ type: "block:append", block })
        });
        void Promise.resolve(outcome).then((settled: any) => {
          if (settled.kind === "prompt") void runTurn(settled.text);
        });
        return;
      }
      if (resolution.kind === "miss") {
        dispatch({
          type: "status:set",
          status: { kind: "warning", text: `Unknown command: /${resolution.name}` }
        });
        return;
      }
      void runTurn(text);
    },
    [slash, conductor, onExit, runTurn]
  );
  const flushBurst = useCallback(() => {
    if (burstTimer.current !== null) {
      clearTimeout(burstTimer.current);
      burstTimer.current = null;
    }
    const text = burst.current;
    if (text.length === 0) return;
    burst.current = "";
    const now = Date.now();
    const active = activePaste.current;
    if (
      active !== null &&
      now <= active.until &&
      text.length > 1 &&
      pasteLines(paste.current, active.ordinal) < PASTE_MARKER_LINE_CAP
    ) {
      const captured = appendToPaste(active.ordinal, text, paste.current);
      paste.current = captured.vault;
      dispatch({ type: "buffer:replaceSpan", find: active.marker, replaceWith: captured.marker });
      activePaste.current = {
        ordinal: active.ordinal,
        marker: captured.marker,
        until: now + PASTE_CONTINUATION_MS
      };
    } else if (text.length > 1 && (classifyPaste(text) === "coalesce" || (active !== null && now <= active.until))) {
      const captured = coalescePaste(text, paste.current);
      paste.current = captured.vault;
      dispatch({ type: "buffer:insert", text: captured.marker });
      activePaste.current = {
        ordinal: captured.vault.minted,
        marker: captured.marker,
        until: now + PASTE_CONTINUATION_MS
      };
    } else {
      dispatch({ type: "buffer:insert", text });
      activePaste.current = null;
    }
    setHighlight(0);
  }, []);
  const armChord = useCallback((next: any) => {
    chord.current = next;
    if (chordTimer.current !== null) clearTimeout(chordTimer.current);
    if (next.armed !== null) {
      chordTimer.current = setTimeout(() => {
        chord.current = NO_CHORD;
        chordTimer.current = null;
      }, CHORD_WINDOW_MS);
    } else {
      chordTimer.current = null;
    }
  }, []);
  useEffect(
    () => () => {
      if (chordTimer.current !== null) clearTimeout(chordTimer.current);
      if (burstTimer.current !== null) clearTimeout(burstTimer.current);
    },
    []
  );
  useEffect(() => {
    const onResize = () => setTerminalRows(process.stdout.rows ?? FALLBACK_TERMINAL_ROWS);
    process.stdout.on("resize", onResize);
    return () => {
      process.stdout.off("resize", onResize);
    };
  }, []);
  const titleName = conductor.sessionName();
  useEffect(() => {
    writeTerminalTitle(titleName && titleName.length > 0 ? titleName : "indus console");
  }, [titleName]);
  const requestExit = useCallback(() => {
    onExit?.();
  }, [onExit]);
  const acceptSuggestion = useCallback(() => {
    if (suggestions.length === 0) return false;
    const chosen = suggestions[Math.min(highlight, suggestions.length - 1)];
    const spliced = applySuggestion(state.buffer, completion.span, chosen);
    dispatch({ type: "buffer:set", text: spliced.buffer });
    dispatch({ type: "caret:jump", offset: spliced.caret });
    setHighlight(0);
    return true;
  }, [suggestions, highlight, state.buffer, completion.span]);
  useInput(
    (rawInput, key) => {
      const input = rawInput.replace(BRACKETED_PASTE, "");
      if (input.length === 0 && input !== rawInput) return;
      const intent = readKey(input, key);
      if (intent.verb === "text:type") {
        burst.current += intent.text ?? "";
        armChord(NO_CHORD);
        if (burstTimer.current !== null) clearTimeout(burstTimer.current);
        burstTimer.current = setTimeout(flushBurst, PASTE_BURST_MS);
        return;
      }
      if (intent.verb !== "flow:submit") {
        flushBurst();
      }
      const step = advanceChord(chord.current, intent);
      armChord(step.next);
      if (step.fired === "clear×2") {
        requestExit();
        return;
      }
      if (step.fired === "dismiss×2") {
        const action = readDoubleEscapeAction(services);
        if (action === "tree") {
          dispatch({ type: "modal:open", kind: "tree" });
        } else if (action === "fork") {
          dispatch({ type: "modal:open", kind: "userTurns" });
        } else {
          dispatch({ type: "buffer:set", text: "" });
        }
        return;
      }
      switch (intent.verb) {
        case "text:newline":
          dispatch({ type: "buffer:insert", text: "\n" });
          return;
        case "edit:erasePrev":
          dispatch({ type: "buffer:erasePrev" });
          setHighlight(0);
          return;
        case "edit:eraseNext":
          dispatch({ type: "buffer:eraseNext" });
          return;
        case "edit:clearLine":
          dispatch({ type: "buffer:set", text: "" });
          return;
        case "nav:left":
          if (state.buffer.length === 0 && deriveAgentRuns(conductor.messages()).length > 0) {
            setAgentsOpen(true);
            return;
          }
          dispatch({ type: "caret:move", delta: -1 });
          return;
        case "nav:right":
          dispatch({ type: "caret:move", delta: 1 });
          return;
        case "nav:home":
          dispatch({ type: "caret:jump", offset: 0 });
          return;
        case "nav:end":
          dispatch({ type: "caret:jump", offset: state.buffer.length });
          return;
        case "nav:up":
          if (suggestions.length > 0) {
            setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
          } else {
            dispatch({ type: "history:back" });
          }
          return;
        case "nav:down":
          if (suggestions.length > 0) {
            setHighlight((h) => (h + 1) % suggestions.length);
          } else {
            dispatch({ type: "history:forward" });
          }
          return;
        case "flow:accept":
          if (!acceptSuggestion()) {
            dispatch({ type: "buffer:insert", text: "  " });
          }
          return;
        case "flow:submit": {
          const pending = burst.current;
          if (pending.length > 0) {
            burst.current = "";
            if (burstTimer.current !== null) {
              clearTimeout(burstTimer.current);
              burstTimer.current = null;
            }
            const at = Math.min(state.caret, state.buffer.length);
            submit(state.buffer.slice(0, at) + pending + state.buffer.slice(at));
            return;
          }
          if (completion.kind === "slash" && suggestions.length > 0) {
            const chosen = suggestions[Math.min(highlight, suggestions.length - 1)];
            const resolved = applySuggestion(state.buffer, completion.span, chosen);
            submit(resolved.buffer);
            return;
          }
          submit(state.buffer);
          return;
        }
        case "flow:dismiss":
          if (state.modal.kind === "approval") {
            const pending = activeApproval(approvalQueue);
            if (pending !== void 0) {
              settleApproval(pending.id, "deny");
            } else {
              dispatch({ type: "modal:close" });
            }
          } else if (state.modal.kind !== "none") {
            dispatch({ type: "modal:close" });
          } else if (state.busy || conductor.snapshot().phase === "condensing") {
            denyAllApprovals();
            conductor.abort();
          } else if (suggestions.length > 0) {
            setHighlight(0);
          }
          return;
        case "flow:interrupt": {
          if (state.busy) {
            denyAllApprovals();
            conductor.abort();
            ctrlCAt.current = 0;
            return;
          }
          const now = Date.now();
          if (state.buffer.length === 0) {
            if (now - ctrlCAt.current <= CTRL_C_EXIT_WINDOW_MS) {
              ctrlCAt.current = 0;
              requestExit();
            } else {
              ctrlCAt.current = now;
            }
          } else {
            dispatch({ type: "buffer:set", text: "" });
            ctrlCAt.current = 0;
          }
          return;
        }
        case "flow:cycleModel":
          conductor.cycleModel?.("");
          return;
        case "model:cycleThinking": {
          const level = conductor.cycleThinkingLevel();
          dispatch({
            type: "status:set",
            status: { kind: "info", text: `Reasoning effort: ${level}.` }
          });
          return;
        }
        case "mode:cyclePermission":
          cyclePermission();
          return;
        case "view:toggleReasoning":
          dispatch({ type: "toggle:reasoning" });
          return;
        case "queue:dequeue": {
          const restored = conductor.dequeueLast();
          if (restored !== void 0) {
            dispatch({ type: "buffer:set", text: restored });
          } else {
            dispatch({
              type: "status:set",
              status: { kind: "warning", text: "No queued message to restore." }
            });
          }
          return;
        }
        case "queue:steer": {
          if (conductor.steerNow()) {
            dispatch({
              type: "status:set",
              status: { kind: "info", text: "Running your queued message now — current run stopped." }
            });
          } else {
            dispatch({
              type: "status:set",
              status: { kind: "warning", text: "No queued message to run — type one first, then Ctrl+X." }
            });
          }
          return;
        }
        case "input:pasteImage": {
          const path = readClipboardImage();
          if (path !== null) {
            const sep = state.buffer.length > 0 && !/\s$/.test(state.buffer) ? " " : "";
            dispatch({ type: "buffer:insert", text: `${sep}${path}` });
          } else {
            dispatch({
              type: "status:set",
              status: { kind: "warning", text: "No image on the clipboard." }
            });
          }
          return;
        }
        case "input:externalEditor": {
          const edited = openInExternalEditor(state.buffer);
          if (edited !== null) {
            dispatch({ type: "buffer:set", text: edited });
          }
          return;
        }
        case "overlay:open":
          if (intent.overlay !== void 0 && intent.overlay !== "none") {
            dispatch({ type: "modal:open", kind: intent.overlay });
          }
          return;
        case "view:expandTools":
          setExpandTools((current) => !current);
          return;
        case "flow:suspend":
          process.kill(process.pid, "SIGTSTP");
          return;
        case "none":
        default:
          return;
      }
    },
    { isActive: state.modal.kind === "none" && !agentsOpen }
  );
  useInput(
    (_rawInput, key) => {
      if (key.tab && key.shift) cyclePermission();
    },
    { isActive: state.modal.kind === "approval" }
  );
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const opening = conductor.permissionMode();
    if (opening !== "default") {
      dispatch({
        type: "status:set",
        status: { kind: "warning", text: permissionModeStatusText(opening) }
      });
    }
    if (initialInput && initialInput.trim().length > 0) {
      void runTurn(initialInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const allMessages = [...conductor.messages()];
  if (allMessages.length < visibleFrom.current) visibleFrom.current = 0;
  const liveMessages = allMessages.slice(visibleFrom.current);
  const agentRuns = deriveAgentRuns(liveMessages);
  const snapshot = projectSnapshot(conductor, liveMessages, services);
  const branch = useMemo(() => readBranch(), []);
  const pendingMessages = conductor.pendingInputs().map((entry: any, index: number) => ({
    id: `pending-${index}-${entry.mode}`,
    mode: entry.mode,
    text: entry.text,
    source: "session"
  }));
  const SHOW_TOOL_ACTIVITY = false;
  const runningTools = Object.values(toolExecutions).some((t: any) => t.status === "running");
  const showTaskPanel = (SHOW_TOOL_ACTIVITY && runningTools) || pendingMessages.length > 0;
  const modalOpen = state.modal.kind !== "none";
  const streamingAnswerRows =
    liveAnswer.current !== null && answerText.current ? Math.min(6, answerText.current.split("\n").length + 1) : 0;
  const taskPanelRows = showTaskPanel ? 2 + Math.min(pendingMessages.length, 8) : 0;
  const workingIndicatorRows = state.busy ? 2 : 0;
  const maxItems = transcriptHeight(
    terminalRows,
    modalOpen,
    agentPanelRows(agentRuns) + streamingAnswerRows + taskPanelRows + workingIndicatorRows
  );
  const providerCount = countProviders(conductor);
  const lastSeenVersion = services?.settings.get("lastSeenVersion") ?? "";
  const startupMap = useMemo(
    () =>
      gatherStartup({
        cwd: process.cwd(),
        home: homedir(),
        version: VERSION,
        lastSeenVersion
      }),
    [lastSeenVersion]
  );
  const quietStartup = (services?.settings.get("quietStartup") ?? false) && !verbose;
  const sweep =
    (services?.settings.get("logoSweep") ?? false) &&
    !(services?.settings.get("reducedMotion") ?? false) &&
    Boolean(process.stdout.isTTY);
  const welcomeSeed = PINNED_WELCOME_SEED;
  const [welcomeName, setWelcomeName] = useState<string | undefined>(void 0);
  useEffect(() => {
    if (!services) return;
    let live = true;
    const provider = services.settings.get("defaultProvider");
    void services.vault
      .defaultAccount(provider)
      .then((account: any) => {
        if (live && account !== void 0) setWelcomeName(account);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [services]);
  const authedProviders = useAuthenticatedProviders(services, state.status);
  const boundModelId = conductor.snapshot().modelId;
  const boundProvider = boundModelId.includes("/") ? boundModelId.split("/")[0] : boundModelId;
  const modelAuthed = authedProviders === null || authedProviders.has(boundProvider);
  const bannerModelId = modelAuthed ? boundModelId : "no authenticated model — run /login";
  const statusBarSnapshot =
    modelAuthed || !snapshot.model
      ? snapshot
      : { ...snapshot, model: { ...snapshot.model, provider: "no model", id: "run /login" } };
  return jsxs(Box, {
    flexDirection: "column",
    children: [
      agentsOpen
        ? jsx(AgentsView, {
            theme: adapter,
            runs: agentRuns,
            activity: subagentActivity,
            tokens: taskTokens,
            onExit: () => setAgentsOpen(false)
          })
        : jsxs(Fragment, {
            children: [
              jsx(Banner, {
                theme: adapter,
                modelId: bannerModelId,
                workspace: process.cwd(),
                version: VERSION,
                verbose,
                quiet: quietStartup,
                compact: false,
                started: liveMessages.length > 0,
                branch,
                name: welcomeName,
                sweep,
                startup: startupMap,
                variantSeed: welcomeSeed
              }),
              compactNote !== null
                ? jsxs(Box, {
                    flexDirection: "column",
                    borderStyle: "round",
                    borderColor: adapter.colors["borderMuted"],
                    paddingX: 1,
                    marginBottom: 1,
                    children: [
                      jsx(Text, {
                        children: adapter.color("accent", "◆ Context condensed — fresh session, history summarized")
                      }),
                      compactNote.length > 0
                        ? jsxs(Fragment, {
                            children: [
                              jsx(Text, { children: adapter.muted("Files carried into the new context:") }),
                              compactNote.map((file, index) =>
                                jsx(Text, { children: adapter.muted(`  · ${file}`) }, index)
                              )
                            ]
                          })
                        : jsx(Text, {
                            children: adapter.muted("No files re-attached; the summary digest carries the history.")
                          })
                    ]
                  })
                : null,
              jsx(MessageList, {
                messages: liveMessages,
                theme: adapter,
                showThinking: state.showReasoning,
                showImages: state.showImages,
                expandToolOutputs: expandTools,
                maxItems,
                displayBlocks: [...state.blocks]
              }),
              liveAnswer.current !== null && answerText.current
                ? jsx(Box, {
                    flexDirection: "column",
                    marginBottom: 1,
                    children: jsx(StreamingMarkdown, { theme: adapter, children: answerText.current })
                  })
                : null,
              showTaskPanel
                ? jsx(TaskPanel, {
                    theme: adapter,
                    snapshot,
                    toolExecutions: SHOW_TOOL_ACTIVITY ? toolExecutions : {},
                    expandToolOutputs: expandTools,
                    pendingMessages
                  })
                : null,
              jsx(WorkingIndicator, {
                theme: adapter,
                busy: state.busy || conductor.snapshot().phase === "condensing",
                phase: conductor.snapshot().phase
              }),
              jsx(Composer, {
                theme: adapter,
                buffer: state.buffer,
                caret: state.caret,
                busy: state.busy,
                suggestions,
                highlight
              }),
              jsx(StatusBar, {
                theme: adapter,
                snapshot: statusBarSnapshot,
                branch,
                providerCount,
                status: state.status,
                permissionMode: conductor.permissionMode()
              }),
              jsx(BackgroundAgents, { theme: adapter, runs: agentRuns, tokens: taskTokens })
            ]
          }),
      jsx(OverlayHost, {
        modal: state.modal,
        services,
        theme: adapter,
        dispatch,
        closeModal: () => dispatch({ type: "modal:close" })
      })
    ]
  });
}

// Silence unused warnings for cross-module imports that may not be used directly here.
void NO_INTENT;