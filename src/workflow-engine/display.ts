import type { WorkflowMeta } from "./parse.js";

export type WorkflowAgentStatus = "queued" | "running" | "done" | "error" | "skipped";

export interface WorkflowAgentSnapshot {
  id: number;
  label: string;
  phase?: string;
  prompt: string;
  status: WorkflowAgentStatus;
  resultPreview?: string;
  error?: string;
  startedAt?: number;
  endedAt?: number;
  tokensIn?: number;
  tokensOut?: number;
  toolCount?: number;
  currentTool?: string;
  lastTool?: string;
}

export interface WorkflowSnapshot {
  name: string;
  description?: string;
  phases: string[];
  currentPhase?: string;
  logs: string[];
  agents: WorkflowAgentSnapshot[];
  agentCount: number;
  runningCount: number;
  doneCount: number;
  errorCount: number;
  durationMs?: number;
  result?: unknown;
}

export interface WorkflowDisplayOptions {
  maxAgents?: number;
  maxLogs?: number;
  showResultPreviews?: boolean;
  maxLines?: number;
}

interface RenderBlock {
  full: string[];
  active: boolean;
  compact: string;
}

export function createWorkflowSnapshot(meta: WorkflowMeta): WorkflowSnapshot {
  return {
    name: meta.name,
    description: meta.description,
    phases: [],
    logs: [],
    agents: [],
    agentCount: 0,
    runningCount: 0,
    doneCount: 0,
    errorCount: 0,
  };
}

export function recomputeWorkflowSnapshot(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  const runningCount = snapshot.agents.filter((agent) => agent.status === "running").length;
  const doneCount = snapshot.agents.filter((agent) => agent.status === "done").length;
  const errorCount = snapshot.agents.filter((agent) => agent.status === "error").length;
  return { ...snapshot, agentCount: snapshot.agents.length, runningCount, doneCount, errorCount };
}

export function renderWorkflowLines(
  snapshot: WorkflowSnapshot,
  options: WorkflowDisplayOptions = {},
  now = Date.now(),
): string[] {
  const maxAgents = options.maxAgents ?? 8;
  const maxLogs = options.maxLogs ?? 2;
  const maxLines = options.maxLines ?? 9;
  const showResultPreviews = options.showResultPreviews ?? false;
  const state = snapshot.errorCount > 0
    ? `, ${snapshot.errorCount} errors`
    : snapshot.runningCount > 0 ? `, ${snapshot.runningCount} running` : "";
  const header = `◆ Workflow: ${snapshot.name} (${snapshot.doneCount}/${snapshot.agentCount} done${state})`;
  const agentPhaseNames = snapshot.agents.map((agent) => agent.phase).filter((phase): phase is string => Boolean(phase));
  const phaseNames = unique([
    ...snapshot.phases,
    ...(snapshot.currentPhase ? [snapshot.currentPhase] : []),
    ...agentPhaseNames,
  ]);
  const rendered = new Set<WorkflowAgentSnapshot>();
  const blocks: RenderBlock[] = [];
  for (const phase of phaseNames) {
    const agents = snapshot.agents.filter((agent) => agent.phase === phase);
    if (agents.length === 0 && snapshot.currentPhase !== phase) continue;
    for (const agent of agents) rendered.add(agent);
    const done = agents.filter((agent) => agent.status === "done").length;
    const running = agents.filter((agent) => agent.status === "running").length;
    const errors = agents.filter((agent) => agent.status === "error").length;
    const skipped = agents.filter((agent) => agent.status === "skipped").length;
    const complete = agents.length > 0 && done + errors + skipped === agents.length;
    const active = running > 0 || errors > 0 || snapshot.currentPhase === phase || !complete;
    const marker = running > 0 || (!complete && snapshot.currentPhase === phase) ? "▶" : complete ? "✓" : " ";
    const counts = `${done}/${agents.length}${running ? ` · ${running} running` : ""}${errors ? ` · ${errors} errors` : ""}${skipped ? ` · ${skipped} skipped` : ""}`;
    const full = [`  ${marker} ${phase} ${counts}`];
    const visibleAgents = agents.slice(-maxAgents);
    for (const agent of visibleAgents) {
      const result = showResultPreviews && agent.resultPreview ? ` — ${agent.resultPreview}` : "";
      const metrics = renderAgentMetrics(agent, now);
      full.push(`    #${agent.id} ${statusIcon(agent.status)} ${shorten(agent.label, 48)}${metrics}${result}`);
    }
    if (agents.length > visibleAgents.length) full.push(`    … ${agents.length - visibleAgents.length} earlier agents`);
    blocks.push({ full, active, compact: compactPhaseLine(marker, phase, done, agents, now) });
  }
  const unphased = snapshot.agents.filter((agent) => !rendered.has(agent));
  if (unphased.length) {
    const full = ["  Unphased"];
    for (const agent of unphased.slice(-maxAgents)) {
      const result = showResultPreviews && agent.resultPreview ? ` — ${agent.resultPreview}` : "";
      full.push(`    #${agent.id} ${statusIcon(agent.status)} ${shorten(agent.label, 48)}${renderAgentMetrics(agent, now)}${result}`);
    }
    blocks.push({ full, active: true, compact: full[0] });
  }
  const visibleLogs = snapshot.logs.slice(-maxLogs);
  const logLines = visibleLogs.length ? ["", ...visibleLogs.map((log) => `  log: ${log}`)] : [];
  return assembleTree(header, blocks, logLines, maxLines);
}

export function assembleTree(header: string, blocks: RenderBlock[], logLines: string[], maxLines: number): string[] {
  if (!Number.isFinite(maxLines)) return [header, ...blocks.flatMap((block) => block.full), ...logLines];
  const baseRow = (block: RenderBlock) => block.active ? block.full : [block.compact];
  const baseLen = 1 + blocks.reduce((n, block) => n + baseRow(block).length, 0) + logLines.length;
  if (baseLen <= maxLines) return [header, ...blocks.flatMap(baseRow), ...logLines];
  const folded = new Set<number>();
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].active) continue;
    const keptLen = blocks.reduce((n, block, j) => folded.has(j) ? n : n + baseRow(block).length, 0);
    const summaryCost = folded.size ? 1 : 0;
    if (1 + keptLen + summaryCost + logLines.length <= maxLines) break;
    folded.add(i);
  }
  const output = [header];
  if (folded.size) output.push(`  … ${folded.size} earlier phases done`);
  blocks.forEach((block, i) => {
    if (!folded.has(i)) output.push(...baseRow(block));
  });
  output.push(...logLines);
  return output;
}

export function compactPhaseLine(
  marker: string,
  phase: string,
  done: number,
  agents: WorkflowAgentSnapshot[],
  now: number,
): string {
  const prefix = `  ${marker} ${phase} ${done}/${agents.length}`;
  const totalTools = agents.reduce((n, agent) => n + (agent.toolCount ?? 0), 0);
  const toolSeg = totalTools > 0 ? ` · ${totalTools} ${totalTools === 1 ? "tool" : "tools"}` : "";
  if (agents.length === 1) {
    const agent = agents[0];
    const elapsedMs = Math.max(0, (agent.endedAt ?? now) - (agent.startedAt ?? agent.endedAt ?? now));
    const secs = agent.startedAt !== undefined ? ` · #${agent.id} ${Math.floor(elapsedMs / 1000)}s` : "";
    return `${prefix}${secs}${toolSeg}`;
  }
  const totalTokens = agents.reduce((n, agent) => n + (agent.tokensIn ?? 0) + (agent.tokensOut ?? 0), 0);
  const tokenSeg = totalTokens > 0 ? ` · ${formatTokens(totalTokens)} tok` : "";
  return `${prefix}${tokenSeg}${toolSeg}`;
}

export function renderWorkflowText(snapshot: WorkflowSnapshot, completed = false, options: WorkflowDisplayOptions = {}, now = Date.now()): string {
  const effective = completed && options.maxLines === undefined ? { ...options, maxLines: Infinity } : options;
  const tree = renderWorkflowLines(snapshot, effective, now);
  return completed ? ["Workflow completed", ...tree].join("\n") : tree.join("\n");
}

export function statusIcon(status: WorkflowAgentStatus): string {
  switch (status) {
    case "queued": return "○";
    case "running": return "●";
    case "done": return "✓";
    case "error": return "✗";
    case "skipped": return "-";
  }
}

export function renderAgentMetrics(agent: WorkflowAgentSnapshot, now: number): string {
  if (agent.startedAt === undefined) return "";
  const running = agent.status === "running";
  const elapsedMs = Math.max(0, (agent.endedAt ?? now) - agent.startedAt);
  const segments = [`${Math.floor(elapsedMs / 1000)}s`];
  const tokensIn = agent.tokensIn ?? 0;
  const tokensOut = agent.tokensOut ?? 0;
  if (tokensIn > 0 || tokensOut > 0) segments.push(`↑${formatTokens(tokensIn)} ↓${formatTokens(tokensOut)}`);
  const toolCount = agent.toolCount ?? 0;
  if (running && (toolCount > 0 || agent.currentTool)) {
    const tail = agent.currentTool ? ` (running ${agent.currentTool})` : "";
    const last = agent.lastTool ?? agent.currentTool;
    segments.push(last ? `${last} ×${toolCount}${tail}` : `0 tools${tail}`);
  } else if (!running && toolCount > 0) {
    segments.push(`${toolCount} ${toolCount === 1 ? "tool" : "tools"}`);
  }
  return `   ${segments.join(" · ")}`;
}

export function formatTokens(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1)}k`;
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function shorten(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function preview(value: unknown, max = 80): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
