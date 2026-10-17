import { Agent } from "indusagi/agent";
import type { AgentEvent, AgentMessage, AgentTool, CanUseToolFn, ThinkingLevel } from "indusagi/agent";
import { createZeroUsage } from "indusagi/ai";
import type { Model, Usage } from "indusagi/ai";
import * as path from "node:path";
import { runShell } from "../kit/run-shell.js";
import { conductorFault } from "./contract.js";
import type { ApprovalResolver, CodingAgentThinkingLevel, ConductorFault, ConductorPhase, ConductorState, PermissionMode, SessionConductor, SessionConductorOptions, SessionHead } from "./contract.js";
import { ModelCatalog, ModelMatcher } from "./catalog/index.js";
import type { CatalogCard } from "./catalog/index.js";
import { SignalHub, translateAgentEvent } from "./signal-hub/index.js";
import { fsBackend, TranscriptStore } from "./transcript-store/index.js";
import { parseSkillInvocation } from "./skill-parse/index.js";
import { isQuotaFault, quotaErrorMessage } from "./quota-error.js";
import { writePlan } from "../capability-deck/cards/plan-file.js";
import { AUTO_CONDENSE_POLICY, isOverBudget } from "../window-budget/index.js";
import { DiagnosticsEngine, formatDiagnosticsSummary, hasEslintConfig, hasTsConfig, isTypeScriptOrJs, runEslintDiagnostics, runTscDiagnostics } from "./diagnostics.js";
import type { DiagnosticsConfig } from "./diagnostics.js";
import { isReasoningEffortSupported, type CodingAgentModel } from "../models.js";

export interface AgentLike {
  subscribe(fn: (event: AgentEvent) => void): () => void;
  prompt(input: string): Promise<void>;
  abort(): void;
  readonly state: { readonly messages: AgentMessage[]; readonly model: Model<any>; readonly isStreaming: boolean };
  replaceMessages(messages: AgentMessage[]): void;
  setModel(model: Model<any>): void;
  setSystemPrompt(prompt: string): void;
  setTools(tools: AgentTool[]): void;
  setThinkingLevel?(level: ThinkingLevel): void;
}
export interface CondenseOpts { readonly instructions?: string; readonly force?: boolean; readonly model?: Model<any>; readonly contextTokens?: number; readonly signal?: AbortSignal; readonly apiKey?: string }
export type CondenseFn = (messages: AgentMessage[], opts?: CondenseOpts) => AgentMessage[] | Promise<AgentMessage[]>;
export const noopCondense: CondenseFn = (messages) => messages;
export interface RetryPolicy { readonly maxAttempts: number; readonly baseDelayMs: number }
export interface ConductorDeps {
  readonly agent?: AgentLike;
  readonly store?: TranscriptStore;
  readonly hub?: SignalHub;
  readonly matcher?: ModelMatcher;
  readonly condense?: CondenseFn;
  readonly retry?: RetryPolicy;
  readonly compactAt?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly diagnostics?: DiagnosticsEngine | DiagnosticsConfig;
}
type StateAction =
  | { readonly type: "phase"; readonly phase: ConductorPhase }
  | { readonly type: "head"; readonly head: SessionHead }
  | { readonly type: "usage"; readonly usage: Usage; readonly contextTokens: number }
  | { readonly type: "model"; readonly modelId: string }
  | { readonly type: "fault"; readonly fault: ConductorFault }
  | { readonly type: "settled" };

export function reduceState(prev: ConductorState, action: StateAction): ConductorState {
  switch (action.type) {
    case "phase": return { ...prev, phase: action.phase };
    case "head": return { ...prev, head: action.head };
    case "usage": return { ...prev, usage: action.usage, contextTokens: action.contextTokens };
    case "model": return { ...prev, modelId: action.modelId };
    case "fault": return { ...prev, phase: "faulted", fault: action.fault };
    case "settled": { const { fault: _fault, ...rest } = prev; return { ...rest, phase: "idle" }; }
  }
}

const DEFAULT_RETRY = { maxAttempts: 2, baseDelayMs: 250 };
const DEFAULT_THINKING_LADDER: readonly CodingAgentThinkingLevel[] = ["off", "low", "medium", "high"];
const PERMISSION_CYCLE: PermissionMode[] = ["default", "acceptEdits", "plan", "bypass"];

function newSessionId(): string { return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`; }
function contextTokensOf(usage: Usage): number { return usage.totalTokens || usage.input + usage.output + usage.cacheRead + usage.cacheWrite; }
function accumulateUsage(a: Usage, b: Usage): Usage {
  return { input: a.input + b.input, output: a.output + b.output, cacheRead: a.cacheRead + b.cacheRead, cacheWrite: a.cacheWrite + b.cacheWrite, totalTokens: a.totalTokens + b.totalTokens, cost: { input: a.cost.input + b.cost.input, output: a.cost.output + b.cost.output, cacheRead: a.cost.cacheRead + b.cost.cacheRead, cacheWrite: a.cost.cacheWrite + b.cost.cacheWrite, total: a.cost.total + b.cost.total } };
}
function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function isTransient(error: unknown): boolean { const text = errorText(error).toLowerCase(); return ["429", "rate limit", "overloaded", "timeout", "timed out", "econnreset", "etimedout", "503", "502", "500", "unavailable", "temporarily"].some((part) => text.includes(part)); }
function isOverloadFault(error: unknown): boolean { const text = errorText(error).toLowerCase(); return text.includes("529") || text.includes("overload"); }
function thinkingLadderForModel(model: Model<any> | undefined): readonly CodingAgentThinkingLevel[] {
  const efforts = (model as CodingAgentModel | undefined)?.reasoningEfforts;
  return efforts?.length ? efforts : DEFAULT_THINKING_LADDER;
}

export function withGatewayBaseUrl<M extends { baseUrl: string; provider: string }>(model: M, gatewayBaseUrls: Record<string, string> | undefined): M {
  const url = gatewayBaseUrls?.[model.provider];
  return url ? { ...model, baseUrl: url } : model;
}

function makeAgent(model: Model<any>, options: SessionConductorOptions, gate?: CanUseToolFn): AgentLike {
  return new Agent({ initialState: { model, ...(options.system !== undefined ? { systemPrompt: options.system } : {}), ...(options.tools ? { tools: options.tools } : {}), ...(options.thinking ? { thinkingLevel: options.thinking } : {}) }, ...(options.getApiKey ? { getApiKey: options.getApiKey } : {}), ...(gate ? { canUseTool: gate } : {}) }) as unknown as AgentLike;
}

class LazyAgent implements AgentLike {
  #real?: AgentLike;
  #model: Model<any>;
  constructor(model: Model<any>, private readonly options: SessionConductorOptions, private readonly gate?: CanUseToolFn) {
    this.#model = model;
  }
  #ensure(): AgentLike { return this.#real ??= makeAgent(this.#model, this.options, this.gate); }
  subscribe(fn: (event: AgentEvent) => void) { return this.#ensure().subscribe(fn); }
  prompt(input: string) { return this.#ensure().prompt(input); }
  abort() { this.#ensure().abort(); }
  get state() { return this.#ensure().state; }
  replaceMessages(messages: AgentMessage[]) { this.#ensure().replaceMessages(messages); }
  setModel(model: Model<any>) { this.#model = model; this.#ensure().setModel(model); }
  setSystemPrompt(prompt: string) { this.#ensure().setSystemPrompt(prompt); }
  setTools(tools: AgentTool[]) { this.#ensure().setTools(tools); }
  setThinkingLevel(level: ThinkingLevel) { this.#ensure().setThinkingLevel?.(level); }
}

function resolveDiagnosticsEngine(workspace: string, dep: ConductorDeps["diagnostics"], liveDefault: boolean): DiagnosticsEngine | undefined {
  if (dep instanceof DiagnosticsEngine) return dep.enabled ? dep : undefined;
  if (dep?.enabled === false || (!dep && (!liveDefault || !hasTsConfig(workspace)))) return undefined;
  const runners = dep?.runners ?? (hasEslintConfig(workspace) ? [runTscDiagnostics, (cwd: string, signal?: AbortSignal) => runEslintDiagnostics(["."], cwd, signal)] : [runTscDiagnostics]);
  return new DiagnosticsEngine(workspace, { ...dep, runners });
}

export function createSessionConductor(options: SessionConductorOptions, deps: ConductorDeps = {}): SessionConductor {
  const store = deps.store ?? new TranscriptStore(newSessionId(), options.sessionsDir ? { backend: fsBackend(options.sessionsDir) } : {});
  const matcher = deps.matcher ?? (deps.agent ? undefined : new ModelMatcher(new ModelCatalog()));
  const modeHolder = { mode: options.permissionMode ?? "default" as PermissionMode };
  const approvalHolder: { resolver?: ApprovalResolver } = {};
  const delegate: ApprovalResolver = async (...args) => approvalHolder.resolver ? approvalHolder.resolver(...args) : "unavailable";
  const gate = options.canUseTool?.(() => modeHolder.mode, delegate);
  let agent = deps.agent;
  if (!agent) {
    const card = matcher?.resolveCard(options.modelId);
    if (!card) throw new Error(`createSessionConductor: no model matches "${options.modelId}"`);
    agent = new LazyAgent(withGatewayBaseUrl(card.model, options.gatewayBaseUrls), options, gate);
  }
  return new SessionConductorImpl(options, { ...deps, matcher, diagnostics: resolveDiagnosticsEngine(options.workspace ?? process.cwd(), deps.diagnostics, !deps.agent) }, agent, store, modeHolder, approvalHolder);
}

class SessionConductorImpl implements SessionConductor {
  #hub: SignalHub;
  #matcher?: ModelMatcher;
  #state: ConductorState;
  #busy = false;
  #activeWork?: Promise<unknown>;
  #shellAbort?: AbortController;
  #draining = false;
  #queue: { mode: "steer" | "followUp"; text: string }[] = [];
  #boundModel?: Model<any>;
  #thinking: CodingAgentThinkingLevel;
  #prePlanMode?: PermissionMode;
  #sessionName?: string;
  #gatewayBaseUrls?: Record<string, string>;
  #condenseAbort?: AbortController;
  #diagnostics?: DiagnosticsEngine;
  #edited = new Set<string>();
  #deckTools: AgentTool[];
  #workspace: string;

  constructor(private readonly options: SessionConductorOptions, private readonly deps: ConductorDeps, private readonly agent: AgentLike, private readonly store: TranscriptStore, private readonly modeHolder: { mode: PermissionMode }, private readonly approvalHolder: { resolver?: ApprovalResolver }) {
    this.#hub = deps.hub ?? new SignalHub(); this.#matcher = deps.matcher; this.#thinking = options.thinking ?? "off"; this.#gatewayBaseUrls = options.gatewayBaseUrls; this.#workspace = options.workspace ?? process.cwd(); this.#deckTools = options.tools ?? []; this.#diagnostics = deps.diagnostics instanceof DiagnosticsEngine ? deps.diagnostics : undefined;
    this.#boundModel = withGatewayBaseUrl(this.#matcher?.resolveCard(options.modelId)?.model ?? agent.state.model, this.#gatewayBaseUrls);
    this.#state = { phase: "idle", head: store.head, usage: createZeroUsage(), contextTokens: 0, modelId: options.modelId };
  }
  subscribe(handler: any) { return this.#hub.subscribe(handler); }
  snapshot() { return this.#state; }
  messages() { return this.agent.state.messages; }
  model() { return this.#boundModel; }
  isBusy() { return this.#busy; }
  availableModels() { return this.#matcher ? [...this.#matcher.resolveAll("")] : []; }
  pendingCount() { return this.#queue.length; }
  pendingInputs() { return [...this.#queue]; }
  enqueue(text: string, mode: "steer" | "followUp" = "followUp") { this.#queue.push({ mode, text }); this.#hub.emit({ kind: "queue", count: this.#queue.length }); }
  clearQueue() { this.#queue.length = 0; this.#hub.emit({ kind: "queue", count: 0 }); }
  dequeueLast() { const item = this.#queue.pop(); if (item) this.#hub.emit({ kind: "queue", count: this.#queue.length }); return item?.text; }
  steerNow() { const item = this.#queue.pop(); if (!item) return false; this.#queue.unshift({ mode: "steer", text: item.text }); this.agent.abort(); return true; }
  abort() { this.clearQueue(); this.#condenseAbort?.abort(); this.#shellAbort?.abort(); this.agent.abort(); const fault = conductorFault("aborted", "turn aborted by caller"); this.#dispatch({ type: "fault", fault }); this.#hub.emit({ kind: "fault", fault }); this.#hub.emit({ kind: "idle" }); }

  async submit(input: string) {
    if (this.#busy) { this.enqueue(input); return this.#state; }
    this.#busy = true;
    const work = (async () => {
      try { await this.#runTurn(input); await this.#drainQueue(); return this.#state; }
      finally { this.#busy = false; }
    })();
    this.#activeWork = work;
    return work;
  }
  async #stopWork() {
    if (!this.#busy) return;
    this.abort();
    await this.#activeWork;
  }
  async #drainQueue() { if (this.#draining) return; this.#draining = true; try { while (this.#queue.length) { const index = this.#queue.findIndex((item) => item.mode === "steer"); const item = index >= 0 ? this.#queue.splice(index, 1)[0] : this.#queue.shift()!; this.#hub.emit({ kind: "queue", count: this.#queue.length }); await this.#runTurn(item.text); } } finally { this.#draining = false; } }
  async #runTurn(input: string) {
    this.#dispatch({ type: "phase", phase: "streaming" });
    const baseline = this.agent.state.messages.length;
    const prompt = parseSkillInvocation(input)?.body ?? input;
    let success = false;
    for (let attempt = 0; attempt <= (this.deps.retry ?? DEFAULT_RETRY).maxAttempts; attempt++) {
      const unsubscribe = this.agent.subscribe((event) => this.#onEvent(event));
      try { await this.agent.prompt(prompt); success = true; unsubscribe(); break; } catch (error) {
        unsubscribe();
        if (isQuotaFault(error)) { const fault = conductorFault("model", quotaErrorMessage(error)!, error); this.#dispatch({ type: "fault", fault }); this.#hub.emit({ kind: "fault", fault }); break; }
        if (attempt < (this.deps.retry ?? DEFAULT_RETRY).maxAttempts && isTransient(error)) { this.#hub.emit({ kind: "fault", fault: conductorFault("model", `transient model fault; retry ${attempt + 1}`, error), transient: true }); await (this.deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))))((this.deps.retry ?? DEFAULT_RETRY).baseDelayMs * 2 ** attempt); continue; }
        if (isOverloadFault(error) && this.options.fallbackModelId) this.selectModel(this.options.fallbackModelId);
        const fault = conductorFault("model", "model turn failed", error); this.#dispatch({ type: "fault", fault }); this.#hub.emit({ kind: "fault", fault }); break;
      }
    }
    if (!success) return;
    for (const message of this.agent.state.messages.slice(baseline)) { try { const entry = await this.store.append(message); this.#hub.emit({ kind: "persisted", entryId: entry.id }); } catch (error) { const fault = conductorFault("persistence", "failed to persist transcript node", error); this.#dispatch({ type: "fault", fault }); this.#hub.emit({ kind: "fault", fault }); } }
    await this.store.persistUsage(this.#state.usage).catch(() => {});
    if ((this.options.autoCompact ?? true) && this.#boundModel && this.store.size > 1 && isOverBudget(this.agent.state.messages, this.#boundModel, AUTO_CONDENSE_POLICY)) await this.#runCondense(false);
    if (this.#state.phase !== "faulted") this.#dispatch({ type: "settled" });
    this.#dispatch({ type: "head", head: this.store.head }); this.#hub.emit({ kind: "idle" });
  }
  #onEvent(event: AgentEvent) {
    if (event.type === "tool_execution_start") { this.#dispatch({ type: "phase", phase: "tooling" }); const args = event.args as any; if ((event.toolName === "edit" || event.toolName === "write") && typeof args?.path === "string" && isTypeScriptOrJs(args.path)) this.#edited.add(path.resolve(this.#workspace, args.path)); }
    if (event.type === "tool_execution_end") this.#dispatch({ type: "phase", phase: "streaming" });
    for (const signal of translateAgentEvent(event)) { if (signal.kind === "turn_end") this.#dispatch({ type: "usage", usage: accumulateUsage(this.#state.usage, signal.usage), contextTokens: contextTokensOf(signal.usage) }); else if (signal.kind === "fault") this.#dispatch({ type: "fault", fault: signal.fault }); this.#hub.emit(signal); }
  }

  selectModel(id: string) { const card = this.#matcher?.resolveCard(id); if (!card) { const fault = conductorFault("model", `no model matches "${id}"`); this.#dispatch({ type: "fault", fault }); this.#hub.emit({ kind: "fault", fault }); return; } this.#applyModel(card); }
  cycleModel(id: string, direction: -1 | 1 = 1) {
    if (id.trim()) { this.selectModel(id); return; }
    const cards = this.availableModels();
    if (!cards.length) return;
    const at = cards.findIndex(card => card.id === this.#state.modelId);
    const index = at < 0 ? 0 : (at + direction + cards.length) % cards.length;
    this.selectModel(cards[index].id);
  }
  #applyModel(card: CatalogCard) { const model = withGatewayBaseUrl(card.model, this.#gatewayBaseUrls); this.agent.setModel(model); this.#boundModel = model; this.#dispatch({ type: "model", modelId: card.id }); }
  updateGatewayBaseUrls(map: Record<string, string>) { this.#gatewayBaseUrls = map; this.selectModel(this.#state.modelId); }
  registerTools(tools: AgentTool[]) { this.agent.setTools([...this.#deckTools, ...tools]); }

  async condense(instructions?: string) {
    if (this.#busy) return "busy" as const;
    this.#busy = true; this.#condenseAbort = new AbortController();
    const work = (async () => {
      try { const result = await this.#runCondense(true, this.#condenseAbort!.signal, instructions); await this.#drainQueue(); return result; }
      finally { this.#busy = false; this.#condenseAbort = undefined; }
    })();
    this.#activeWork = work;
    return work;
  }
  cancelCondense() { this.#condenseAbort?.abort(); }
  async #runCondense(force: boolean, signal?: AbortSignal, instructions?: string) {
    const before = [...this.agent.state.messages]; this.#dispatch({ type: "phase", phase: "condensing" });
    try { const after = await (this.deps.condense ?? noopCondense)(before, { force, model: this.#boundModel, contextTokens: this.#state.contextTokens, signal, instructions }); if (signal?.aborted) { this.#dispatch({type:"settled"}); this.#hub.emit({kind:"idle"}); return "cancelled" as const; } if (after.length >= before.length) { this.#dispatch({ type: "settled" }); return "nothing" as const; } this.agent.replaceMessages(after); await this.store.reset(); for (let i = 0; i < after.length; i++) await this.store.append(after[i], i === 0 ? "condense" : undefined); this.#dispatch({ type: "head", head: this.store.head }); this.#hub.emit({ kind: "compacted", manual: force }); this.#dispatch({ type: "settled" }); return "condensed" as const; } catch (error) { const fault = conductorFault("overflow", "auto-condense failed", error); this.#dispatch({ type: "fault", fault }); this.#hub.emit({ kind: "fault", fault }); return "failed" as const; }
  }

  async fork(id: string) { await this.#move(id, `cannot fork from "${id}"`); }
  async navigateTree(id: string) { await this.#move(id, `cannot navigate to "${id}"`); }
  async #move(id: string, message: string) { try { await this.#stopWork(); await this.store.branchAt(id); this.agent.replaceMessages(this.store.messages()); this.#dispatch({ type: "head", head: this.store.head }); this.#dispatch({ type: "settled" }); this.#hub.emit({ kind: "reset" }); this.#hub.emit({ kind: "idle" }); } catch (error) { const fault = conductorFault("persistence", message, error); this.#dispatch({ type: "fault", fault }); this.#hub.emit({ kind: "fault", fault }); } }
  async restoreCode(id: string) { return this.options.checkpoint?.restore(id) ?? []; }
  async codeRestoreInfo(id: string) { return { canRestore: this.options.checkpoint?.hasSnapshot(id) ?? false }; }
  async executeBash(command: string, opts: { excludeFromContext?: boolean; signal?: AbortSignal } = {}) {
    if (this.#busy) throw new Error("A turn is running — stop it before running a shell command.");
    this.#busy = true; this.#shellAbort = new AbortController();
    const signal = opts.signal ? AbortSignal.any([opts.signal, this.#shellAbort.signal]) : this.#shellAbort.signal;
    const work = (async () => {
      try {
        this.#dispatch({type:"phase",phase:"tooling"});
        const outcome = await runShell(command, this.#workspace, signal);
        if (!opts.excludeFromContext) {
          const message: AgentMessage = {role:"user",content:`$ ${command}\n${outcome.output}`.trimEnd(),timestamp:Date.now()};
          const entry = await this.store.append(message, "note");
          this.agent.replaceMessages([...this.agent.state.messages, message]);
          this.#dispatch({type:"head",head:this.store.head});
          this.#hub.emit({kind:"persisted",entryId:entry.id});
        }
        this.#dispatch({type:"settled"}); this.#hub.emit({kind:"idle"});
        await this.#drainQueue();
        return outcome;
      } finally { this.#busy = false; this.#shellAbort = undefined; }
    })();
    this.#activeWork = work;
    return work;
  }

  stats() { const messages = this.agent.state.messages; let userMessages = 0, assistantMessages = 0, toolCalls = 0, toolResults = 0; for (const message of messages) { if (message.role === "user") userMessages++; else if (message.role === "assistant") { assistantMessages++; for (const part of message.content ?? []) if (typeof part === "object" && part && part.type === "toolCall") toolCalls++; } else if (message.role === "toolResult") toolResults++; } const usage = this.#state.usage; return { sessionId: this.#state.head.sessionId, userMessages, assistantMessages, toolCalls, toolResults, totalMessages: messages.length, tokens: { input: usage.input, output: usage.output, cacheRead: usage.cacheRead, cacheWrite: usage.cacheWrite, total: usage.totalTokens }, cost: usage.cost.total }; }
  costReport() { const stats = this.stats(); return [`Total cost:            $${stats.cost.toFixed(4)}`, `Total tokens:          ${stats.tokens.total}`, `  Input:               ${stats.tokens.input}`, `  Output:              ${stats.tokens.output}`, `  Cache read:          ${stats.tokens.cacheRead}`, `  Cache write:         ${stats.tokens.cacheWrite}`].join("\n"); }
  thinkingLevel() { return this.#thinking; }
  setThinkingLevel(level: CodingAgentThinkingLevel) { if (!isReasoningEffortSupported(this.#boundModel?.id, level)) return; this.#thinking = level; this.agent.setThinkingLevel?.(level as ThinkingLevel); }
  cycleThinkingLevel() { const ladder = thinkingLadderForModel(this.#boundModel); const next = ladder[(ladder.indexOf(this.#thinking) + 1) % ladder.length]; this.setThinkingLevel(next); return next; }
  permissionMode() { return this.modeHolder.mode; }
  setPermissionMode(mode: PermissionMode) { this.modeHolder.mode = mode; }
  setApprovalResolver(resolver: ApprovalResolver | undefined) { this.approvalHolder.resolver = resolver; }
  prePlanMode() { return this.#prePlanMode; }
  togglePlanMode(on: boolean) { if (on) { if (this.modeHolder.mode !== "plan") { this.#prePlanMode = this.modeHolder.mode; this.modeHolder.mode = "plan"; } } else { this.modeHolder.mode = this.#prePlanMode ?? "default"; this.#prePlanMode = undefined; } return this.modeHolder.mode; }
  cyclePermissionMode() { const current = this.modeHolder.mode === "bypassPermissions" ? "bypass" : this.modeHolder.mode; const next = PERMISSION_CYCLE[(PERMISSION_CYCLE.indexOf(current) + 1) % PERMISSION_CYCLE.length]; this.setPermissionMode(next); return next; }
  sessionName() { return this.#sessionName; }
  setSessionName(name: string) { this.#sessionName = name; }
  async resume(id: string) { await this.#stopWork(); if (!await this.store.load(id)) { const fault = conductorFault("persistence", `no session "${id}" to resume`); this.#dispatch({ type: "fault", fault }); this.#hub.emit({ kind: "fault", fault }); return; } this.agent.replaceMessages(this.store.messages()); this.#state = { ...this.#state, head: this.store.head, usage: this.store.usage ?? createZeroUsage(), phase: "idle" }; this.#hub.emit({kind:"reset"}); this.#hub.emit({ kind: "idle" }); }
  async newSession() { await this.#stopWork(); this.agent.replaceMessages([]); this.store.startNewSession(newSessionId()); this.#queue.length = 0; this.#sessionName = undefined; this.#state = { phase: "idle", head: this.store.head, usage: createZeroUsage(), contextTokens: 0, modelId: this.#state.modelId }; this.#hub.emit({kind:"reset"}); this.#hub.emit({ kind: "idle" }); }
  #dispatch(action: StateAction) {
    const phase = this.#state.phase;
    this.#state = reduceState(this.#state, action);
    if (phase !== this.#state.phase) this.#hub.emit({kind:"phase",phase:this.#state.phase});
  }
}
