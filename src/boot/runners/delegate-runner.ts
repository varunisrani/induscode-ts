/**
 * Boot helper: a live {@link DelegateRunner} that makes the `task` tool real.
 *
 * The `task` capability ({@link "../../capability-deck/cards/task-card"}) advertises
 * sub-agent delegation but only *runs* it when a {@link DelegateRunner} is wired
 * into the deck context under {@link DELEGATE_HANDLE_KEY}; absent one it degrades
 * to a typed `STUB_NOTE`. This module supplies that runner.
 *
 * Each delegated objective spins a *fresh, isolated* framework {@link Agent} (the
 * same `facade/bot` Agent the conductor already drives — NOT the swarm `Crew` nor
 * `runtime/createAgent`) bound to the parent's model id and credential resolver,
 * given a survey-style system prompt and a deck that DELIBERATELY excludes the
 * `task` card. That exclusion is the recursion guard: a sub-agent with no `task`
 * tool cannot spawn its own sub-agents. The runner submits one prompt, lets the
 * sub-agent run its own tool loop to completion, then extracts the final
 * assistant turn's text as the single report handed back to the parent.
 *
 * The runner never throws out of `run()`: a model that does not resolve, a
 * sub-agent error, or an empty transcript all map to a `{ ok:false, report }`
 * result so a delegation failure surfaces to the parent agent as an ordinary
 * tool error rather than crashing the turn. Cancellation is forwarded: an
 * already-aborted signal short-circuits, and an abort raised mid-run calls
 * `agent.abort()`.
 *
 * The `spawn`/`tools` options are pure test seams — they let a unit test drive
 * the runner with an in-memory fake instead of a real network round-trip.
 */
import { Agent } from "indusagi/agent";
import {
  type AgentMessage,
  type AgentTool,
  type DelegateRunner,
  type SessionPermissionPolicy,
  ModelCatalog,
  ModelMatcher,
  withGatewayBaseUrl,
  createSubagentPermissionGate,
} from "../../conductor/index.js";
import { provisionDeck } from "../../capability-deck/index.js";

/**
 * The minimal sub-agent surface the runner drives.
 *
 * A real framework {@link Agent} satisfies this structurally; a test passes a
 * lightweight fake via {@link DelegateRunnerOptions.spawn}. Only the pieces the
 * runner touches are named — submit a prompt, abort, and read the resulting
 * transcript/error afterward.
 */
export interface DelegateSubAgent {
  prompt(input: string): Promise<void>;
  abort(): void;
  readonly state: {
    messages: readonly AgentMessage[];
    error?: string;
  };
  /**
   * Optional event subscription (the real framework `Agent` provides it). The
   * runner uses it to recompute live token spend as the sub-agent works; a test
   * fake may omit it, in which case no progress is reported.
   */
  subscribe?(listener: () => void): () => void;
}

/** Configuration for {@link createDelegateRunner}. */
export interface DelegateRunnerOptions {
  /** The model id the sub-agent runs under (the parent's resolved model). */
  readonly modelId: string;
  /** The working directory the sub-agent's deck is scoped to. */
  readonly cwd: string;
  /** The system prompt that shapes the sub-agent's behaviour. */
  readonly system: string;
  /**
   * Per-call credential resolver, forwarded to the framework `Agent` unchanged
   * (OAuth-only providers, short-lived token rotation). Omitted from the agent
   * options entirely when undefined so the framework env-var lookup still wins.
   */
  readonly getApiKey?: (provider: string) => Promise<string | undefined> | string | undefined;
  /**
   * Test seam: build the sub-agent from the objective instead of constructing a
   * real framework `Agent`. When omitted the runner uses `new Agent`.
   */
  readonly spawn?: (objective: string, context?: string) => DelegateSubAgent;
  /**
   * Test seam: the tool deck the sub-agent runs with. When omitted the runner
   * provisions the read-only `'authoring'` profile (which already excludes the
   * `task` card — the recursion guard).
   */
  readonly tools?: () => AgentTool[];
  /**
   * Resolve the current server-tier gateway routing map (provider -> gateway
   * base url). Called FRESH on every `run()` — never cached — so a mid-session
   * `/login` (to "Indus Server"), including one that lands after this runner was
   * constructed but before a given delegated call, is always picked up. This
   * mirrors {@link getApiKey}, which is likewise invoked per-request rather than
   * resolved once at construction.
   */
  readonly getGatewayBaseUrls?: () => Promise<Record<string, string>>;
  /**
   * The parent session's live permission policy: the SAME mutable rule list the
   * parent gate reads plus a live getter onto the conductor's current mode. When
   * present, every spawned sub-agent runs under a RESOLVER-LESS gate built from
   * it — deny/ask rules, plan-mode enforcement, and the catastrophic-bash
   * blocklist apply per inner tool call, and a mid-run mode switch (Shift+Tab)
   * retargets the very next delegated tool call. A sub-agent cannot prompt, so
   * an `ask` decision deterministically denies with an actionable message.
   * Absent (a bare test construction), the sub-agent runs ungated as before.
   */
  readonly permissionPolicy?: SessionPermissionPolicy;
}

function sumTokens(messages: readonly AgentMessage[]): number {
  let total = 0;
  for (const message of messages) {
    const usage = (message as { usage?: { input?: number; output?: number } }).usage;
    if (usage) total += (usage.input ?? 0) + (usage.output ?? 0);
  }
  return total;
}

function oneLine(text: string, max = 120): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}\u2026` : flat;
}

function argPreview(args: unknown): string {
  if (args === null || typeof args !== "object") return "";
  const entries = Object.entries(args as Record<string, unknown>);
  if (entries.length === 0) return "";
  const value = entries[0][1];
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return ` (${oneLine(String(text), 56)})`;
}

interface ActivityEntry {
  tone: "reason" | "tool";
  text: string;
}

function buildActivity(messages: readonly AgentMessage[]): ActivityEntry[] {
  const out: ActivityEntry[] = [];
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const content = (message as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content as Array<Record<string, unknown>>) {
      const p = part;
      if ((p.type === "text" && typeof p.text === "string" && p.text.trim()) || (p.type === "thinking" && typeof p.thinking === "string" && p.thinking.trim())) {
        out.push({ tone: "reason", text: oneLine((p.text ?? p.thinking) as string) });
      } else if (p.type === "toolCall" && typeof p.name === "string") {
        const name = (p.name as string).charAt(0).toUpperCase() + (p.name as string).slice(1);
        out.push({ tone: "tool", text: `${name}${argPreview(p.arguments)}` });
      }
    }
  }
  return out.slice(-14);
}

const MAX_PARALLEL_TASKS = (() => {
  const n = parseInt(process.env.INDUS_MAX_PARALLEL_TASKS ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 2;
})();

const MAX_REPORT_CHARS = (() => {
  const n = parseInt(process.env.INDUS_MAX_DELEGATE_REPORT_CHARS ?? "", 10);
  return Number.isFinite(n) && n >= 1000 ? n : 48000;
})();

let activeTasks = 0;
const taskQueue: Array<() => void> = [];

async function acquireTaskSlot(): Promise<() => void> {
  if (activeTasks < MAX_PARALLEL_TASKS) {
    activeTasks++;
  } else {
    await new Promise<void>((resolve) => taskQueue.push(resolve));
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const next = taskQueue.shift();
    if (next) next();
    else activeTasks--;
  };
}

function clampReport(report: string): string {
  if (report.length <= MAX_REPORT_CHARS) return report;
  const head = Math.floor(MAX_REPORT_CHARS * 0.7);
  const tail = MAX_REPORT_CHARS - head;
  const omitted = report.length - MAX_REPORT_CHARS;
  return `${report.slice(0, head)}\n\n\u2026[delegate report truncated \u2014 ${omitted} characters omitted to protect parent context]\u2026\n\n${report.slice(report.length - tail)}`;
}

function finalAssistantText(messages: readonly AgentMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "assistant") continue;
    const content = (message as { content?: unknown }).content;
    if (!Array.isArray(content)) return typeof content === "string" ? content : "";
    return (content as Array<Record<string, unknown>>)
      .filter(
        (block) => !!block && typeof block === "object" && block.type === "text" && typeof block.text === "string",
      )
      .map((block) => block.text as string)
      .join("");
  }
  return "";
}

/**
 * Build a live {@link DelegateRunner} the host wires into the deck context.
 *
 * The model is resolved once up front; if the id resolves to nothing the runner
 * still builds but every `run()` reports `{ ok:false }` rather than throwing, so
 * a misconfigured model can never crash the parent's turn.
 *
 * @param opts the model id, cwd, system prompt, and optional credential/test seams
 * @returns a runner satisfying the task card's {@link DelegateRunner} contract
 */
export function createDelegateRunner(opts: DelegateRunnerOptions): DelegateRunner {
  const model = new ModelMatcher(new ModelCatalog()).resolveCard(opts.modelId)?.model;
  return {
    async run(
      request: { objective: string; context?: string },
      signal?: AbortSignal,
      onProgress?: (info: { tokens: number; activity: ActivityEntry[] }) => void,
    ) {
      if (opts.spawn === undefined && model === undefined) {
        return { ok: false, report: "no model resolved for delegation" };
      }
      if (signal?.aborted) {
        return { ok: false, report: "delegation aborted" };
      }
      const objective = request.context
        ? `${request.objective}\n\nContext:\n${request.context}`
        : request.objective;
      const gatewayBaseUrls = await opts.getGatewayBaseUrls?.();
      const releaseSlot = await acquireTaskSlot();
      try {
        if (signal?.aborted) {
          return { ok: false, report: "delegation aborted" };
        }
        let agent: DelegateSubAgent | undefined = opts.spawn?.(request.objective, request.context);
        if (agent === undefined) {
          const tools = opts.tools?.() ?? provisionDeck("authoring", { cwd: opts.cwd }).tools();
          agent = new Agent({
            initialState: {
              model: withGatewayBaseUrl(model as never, gatewayBaseUrls ?? {}),
              systemPrompt: opts.system,
              tools,
            },
            ...opts.getApiKey ? { getApiKey: opts.getApiKey } : {},
            ...opts.permissionPolicy !== undefined
              ? { canUseTool: createSubagentPermissionGate(opts.permissionPolicy, tools) }
              : {},
          }) as unknown as DelegateSubAgent;
        }
        const onAbort = () => agent!.abort();
        signal?.addEventListener("abort", onAbort, { once: true });
        let lastSignature = "";
        const reportProgress = () => {
          if (!onProgress) return;
          const tokens = sumTokens(agent!.state.messages);
          const activity = buildActivity(agent!.state.messages);
          const signature = `${tokens}:${activity.length}`;
          if (signature !== lastSignature) {
            lastSignature = signature;
            onProgress({ tokens, activity });
          }
        };
        const offProgress = onProgress ? agent.subscribe?.(reportProgress) : undefined;
        try {
          await agent.prompt(objective);
          reportProgress();
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : String(cause);
          return { ok: false, report: clampReport(message || "delegation failed") };
        } finally {
          offProgress?.();
          signal?.removeEventListener("abort", onAbort);
        }
        const error = agent.state.error;
        const report = finalAssistantText(agent.state.messages);
        return {
          ok: error === undefined && report.length > 0,
          report: clampReport(error ?? (report || "(no output)")),
        };
      } finally {
        releaseSlot();
      }
    },
  };
}
