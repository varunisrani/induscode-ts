/**
 * Boot helper: assemble a {@link SessionConductor} for a non-interactive runner.
 *
 * Both the oneshot and the link runners drive a live conductor; this module owns
 * the one place that turns a {@link BootContext} into one, so the two runners do
 * not each re-derive the model id and session options. The model is taken from
 * the invocation when supplied, else resolved to the catalog default through the
 * {@link ModelMatcher}; the conductor itself is built lazily so no framework agent
 * is constructed until the first turn runs.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createMCPAgentToolFactory, loadMCPConfig, MCPClientPool } from "indusagi/mcp";
import {
  type AgentTool,
  type ApprovalResolver,
  type CanUseToolFn,
  type CheckpointStore,
  type DelegateRunner,
  type MemoryStore,
  type PermissionMode,
  type PermissionRule,
  createSessionConductor,
  isPermissionMode,
  makeRule,
  createPermissionGate,
} from "../../conductor/index.js";
import {
  type ContextDoc,
  type SkillCard,
  composeBriefing,
  gatherContextDocs,
  gatherSkillCards,
  modelInvocableCards,
  joinBlocks,
  bullets,
} from "../../briefing/index.js";
import {
  clearStaleToolResults,
  condense,
  planSlice,
  rehydrateRecentReads,
  AUTO_CONDENSE_POLICY,
} from "../../window-budget/index.js";
import { ModelCatalog, ModelMatcher } from "../../conductor/index.js";
import { provisionDeck } from "../../capability-deck/index.js";
import { type WorkflowAgentRunner } from "../../workflow-engine/index.js";
import { PreferenceStore } from "../../settings/manager.js";
import { createDelegateRunner } from "./delegate-runner.js";
import { createCheckpointStore, CHECKPOINT_HANDLE_KEY } from "./checkpoint.js";
import { createReadStateStore, READ_STATE_HANDLE_KEY } from "./read-state.js";
import { MEMORY_HANDLE_KEY, WORKFLOW_HANDLE_KEY, DELEGATE_HANDLE_KEY } from "../../capability-deck/index.js";
import { createWorkflowAgentRunner } from "../../workflow-engine/index.js";
import { loadZohoAgentTools } from "../../integrations/zoho/index.js";
import { loadSarvamAgentTools } from "../../integrations/sarvam/index.js";
import { createAuthVault } from "../auth-vault.js";
import { TOKEN_FILE, hasValidServerToken, getServerToken } from "../server-token.js";
import { resolveServerMode, resolveServerGatewayUrls, serverTierProviders } from "./server-mode.js";
import { DiskMemoryStore, memoryDirFor, loadMemoryDoc } from "./memdir.js";
import { buildAddonHost, wrapToolsWithAddons, concatAddonTools } from "./addon-wiring.js";
import type { BootContext, Invocation } from "../contract.js";

interface AuthFileData {
  [provider: string]: unknown;
}

function authenticatedProviders(ctx: BootContext): string[] {
  try {
    const path = ctx.workspace.authPath;
    if (!existsSync(path)) return [];
    const data = JSON.parse(readFileSync(path, "utf8")) as AuthFileData;
    return Object.keys(data).filter((id) => {
      const accounts = data[id];
      return id.length > 0 && accounts !== null && typeof accounts === "object" && Object.keys(accounts as object).length > 0;
    });
  } catch {
    return [];
  }
}

const PREFERRED_DEFAULT: Record<string, string[]> = {
  anthropic: [
    "claude-sonnet-4-5",
    "claude-haiku-4-5",
    "claude-sonnet-4-6",
    "claude-sonnet-4-0",
    "claude-opus-4-5",
  ],
  openai: ["gpt-5.1", "gpt-4.1", "gpt-4o"],
  minimax: ["MiniMax-M3", "MiniMax-M2.7", "MiniMax-M2.5"],
  sarvam: ["sarvam-105b", "sarvam-30b"],
};

function hasServerSessionSync(): boolean {
  try {
    const token = JSON.parse(readFileSync(TOKEN_FILE, "utf8")) as { expires_at?: unknown };
    return typeof token.expires_at === "string" && new Date(token.expires_at).getTime() - Date.now() > 5 * 60 * 1000;
  } catch {
    return false;
  }
}

function providerDefaultModel(catalog: ModelCatalog, provider: string): string | undefined {
  const cards = catalog.byProvider(provider);
  if (cards.length === 0) return undefined;
  for (const bare of PREFERRED_DEFAULT[provider] ?? []) {
    const hit = cards.find((c) => c.id === `${provider}/${bare}`);
    if (hit) return hit.id;
  }
  return cards[cards.length - 1].id;
}

/**
 * Resolve the model id for this run.
 *
 * Precedence: an explicit `--model` selector wins; otherwise a current model of a
 * provider the user has authenticated for (so a fresh launch lands on a model the
 * stored key can actually call); otherwise the catalog default.
 *
 * @param ctx the boot context carrying the parsed invocation
 * @returns the canonical model id to bind the session to
 */
export function resolveModelId(ctx: BootContext): string {
  const explicit = ctx.invocation.modelId;
  if (explicit !== undefined && explicit.trim().length > 0) {
    return explicit;
  }
  const catalog = new ModelCatalog();
  for (const provider of authenticatedProviders(ctx)) {
    const id = providerDefaultModel(catalog, provider);
    if (id !== undefined) return id;
  }
  if (hasServerSessionSync()) {
    for (const provider of serverTierProviders()) {
      const id = providerDefaultModel(catalog, provider);
      if (id !== undefined) return id;
    }
  }
  const card = new ModelMatcher(catalog).resolve({});
  return card?.id ?? "";
}

const PROVIDER_ENV: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  "azure-openai-responses": "AZURE_OPENAI_API_KEY",
  google: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  cerebras: "CEREBRAS_API_KEY",
  xai: "XAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  "vercel-ai-gateway": "AI_GATEWAY_API_KEY",
  zai: "ZAI_API_KEY",
  mistral: "MISTRAL_API_KEY",
  minimax: "MINIMAX_API_KEY",
  "minimax-cn": "MINIMAX_CN_API_KEY",
  opencode: "OPENCODE_API_KEY",
  sarvam: "SARVAM_API_KEY",
  krutrim: "KRUTRIM_API_KEY",
  nvidia: "NVIDIA_API_KEY",
};

interface AuthAccountRecord {
  kind?: string;
  isDefault?: boolean;
  key?: string;
  access?: string;
}

function primeProviderEnv(ctx: BootContext): void {
  try {
    const path = ctx.workspace.authPath;
    if (!existsSync(path)) return;
    const data = JSON.parse(readFileSync(path, "utf8")) as AuthFileData;
    for (const [provider, accounts] of Object.entries(data)) {
      if (provider.startsWith("_") || accounts === null || typeof accounts !== "object") continue;
      const envVar = PROVIDER_ENV[provider];
      if (envVar === undefined || process.env[envVar]) continue;
      const list = Object.values(accounts as Record<string, AuthAccountRecord>);
      const chosen = list.find((a) => a?.isDefault) ?? list[0];
      const value = chosen?.kind === "apiKey" ? chosen.key : chosen?.access;
      if (typeof value === "string" && value.length > 0) {
        process.env[envVar] = value;
      }
    }
  } catch {
    // ignore
  }
}

function buildKeyResolver(
  ctx: BootContext,
  vault: ReturnType<typeof createAuthVault>,
  requestedAccount: string | undefined,
) {
  return async (provider: string): Promise<string | undefined> => {
    try {
      const candidates: (string | undefined)[] = [
        requestedAccount,
        await vault.defaultAccount(provider),
        (await vault.listAccounts(provider))[0],
      ];
      for (const account of candidates) {
        if (account === undefined) continue;
        const key = await vault.readUsableKey(provider, account);
        if (key) return key;
      }
      const server = await resolveServerMode(ctx, provider, vault);
      if (server.serverMode && server.token) return server.token;
      // also surface ambient env so providers that the user has not persisted but
      // did export keep working in the local-key path
      const envVar = PROVIDER_ENV[provider];
      if (envVar && process.env[envVar]) return process.env[envVar];
      return undefined;
    } catch {
      return undefined;
    }
  };
}

const THINKING_LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh"]);

function resolveThinkingLevel(raw: string | undefined): string | undefined {
  return raw !== undefined && THINKING_LEVELS.has(raw) ? raw : undefined;
}

function resolveText(value: string): string {
  try {
    if (existsSync(value)) return readFileSync(value, "utf8");
  } catch {
    // ignore
  }
  return value;
}

const PROFILE_DIR = ".indusagi";

function skillRoots(cwd: string): Array<{ dir: string; origin: "project" | "user" }> {
  return [
    { dir: join(cwd, PROFILE_DIR, "skills"), origin: "project" },
    { dir: join(homedir(), PROFILE_DIR, "skills"), origin: "user" },
  ];
}

/**
 * Gather the on-disk skill cards the model may invoke this run: walk the project
 * and user `.indusagi/skills` roots and drop any card flagged
 * `disable-model-invocation` (those stay loadable explicitly, but the model is
 * not told about them). A filesystem walk error degrades to an empty list so a
 * bad/unreadable skills dir never sinks the session.
 */
export function gatherModelSkills(cwd: string): SkillCard[] {
  try {
    return modelInvocableCards(gatherSkillCards(skillRoots(cwd)).cards);
  } catch {
    return [];
  }
}

const WORKFLOW_TOOL_ENABLED = false;

export function selectTools(
  cwd: string,
  inv: Invocation,
  runner?: DelegateRunner,
  memoryStore?: MemoryStore,
  checkpoint?: CheckpointStore,
  workflowRunner?: WorkflowAgentRunner,
): AgentTool[] {
  if (inv.noTools) return [];
  const framework: Record<string, unknown> = {
    ...runner ? { [DELEGATE_HANDLE_KEY]: runner } : {},
    ...memoryStore ? { [MEMORY_HANDLE_KEY]: memoryStore } : {},
    [READ_STATE_HANDLE_KEY]: createReadStateStore(),
    ...checkpoint ? { [CHECKPOINT_HANDLE_KEY]: checkpoint } : {},
    ...workflowRunner && WORKFLOW_TOOL_ENABLED ? { [WORKFLOW_HANDLE_KEY]: workflowRunner } : {},
  };
  const all = provisionDeck("all", {
    cwd,
    ...Object.keys(framework).length > 0 ? { framework } : {},
  }).tools();
  const visible = WORKFLOW_TOOL_ENABLED ? all : all.filter((tool) => tool.name !== "workflow");
  if (inv.tools === undefined || inv.tools.length === 0) return visible;
  const canon = (name: string) => name.toLowerCase().replace(/[_-]/g, "");
  const allow = new Set(inv.tools.map(canon));
  return visible.filter((tool) => allow.has(canon(tool.name)));
}

/**
 * Compose the run's system prompt: `--system` replaces the built-in briefing,
 * `--append-system` adds a trailing block, and both compose (override then
 * append). With neither, it is the tool-aware built-in briefing.
 */
export function composeSystem(
  tools: AgentTool[],
  inv: Invocation,
  cwd: string,
  skills: readonly SkillCard[] = [],
  memoryDoc?: ContextDoc,
): string {
  const contextDocs = [
    ...gatherContextDocs(cwd, homedir()),
    ...memoryDoc ? [memoryDoc] : [],
  ];
  let base = inv.system !== undefined ? resolveText(inv.system) : composeBriefing({ tools, contextDocs, skills });
  base = `${base}\n\n${renderSessionGuidanceSection(tools, skills)}`;
  base = `${base}\n\n${renderEnvironmentSection(cwd, inv)}`;
  if (inv && typeof inv.language === "string" && inv.language.length > 0) {
    base = `${base}\n\n${renderLanguageSection(inv.language)}`;
  }
  if (Array.isArray(inv?.mcpInstructions) && inv.mcpInstructions.length > 0) {
    base = `${base}\n\n${renderMcpInstructionsSection(inv.mcpInstructions)}`;
  }
  const hasZoho = Array.isArray(tools) && tools.some((t) => typeof t?.name === "string" && (t.name.startsWith("zoho") || t.name.includes("ZohoCRM") || t.name.includes("zoho__")));
  if (hasZoho) {
    base = `${base}\n\n## Zoho CRM (MCP)\nYou have live Zoho CRM tools (names often start with zoho_ or zoho__). Use them for CRM data — never invent record IDs. If only Leads tools are available, say so when the user asks about Deals/pipeline.`;
  }
  const hasSarvam = Array.isArray(tools) && tools.some((t) => typeof t?.name === "string" && (t.name.startsWith("sarvam") || t.name.includes("sarvam__") || t.name.includes("sarvam_")));
  if (hasSarvam) {
    base = `${base}\n\n## Sarvam AI (MCP)\nYou have live Sarvam tools for Indian-language STT, TTS, translation, transliteration, language ID, LLM, and vision. Prefer these tools for Indic language work; do not invent transcripts or translations. Audio/docs may be written under SARVAM_MCP_BASE_PATH (default ~/Desktop). Use actual tool names from your tool list (often prefixed sarvam_ or sarvam__).`;
  }
  return inv.appendSystem !== undefined ? `${base}\n\n${resolveText(inv.appendSystem)}` : base;
}

function renderSessionGuidanceSection(tools: AgentTool[], skills: readonly SkillCard[]): string {
  const enabled = Array.isArray(tools) ? tools : [];
  const hasSkills = Array.isArray(skills) && skills.length > 0 && enabled.some((t) => t.name === "task");
  const items: string[] = [];
  if (hasSkills) {
    items.push("Use the task tool to delegate focused, self-contained sub-tasks. Subagents are valuable for parallelizing independent queries or for protecting the main context window from excessive results, but they should not be used excessively when not needed. Importantly, avoid duplicating work that subagents are already doing \u2014 if you delegate research to a subagent, do not also perform the same searches yourself.");
  }
  if (enabled.some((t) => t.name === "grep") || enabled.some((t) => t.name === "find")) {
    items.push("For simple, directed codebase searches (e.g. for a specific file/class/function) use grep or find directly. For broader codebase exploration and deep research, use the task tool to delegate to a sub-agent.");
  }
  items.push(`If the user denies a tool call, do not re-attempt the exact same tool call with the same arguments. Escalate to the user with the ask_user_question tool only when you're genuinely stuck after investigation.`);
  if (hasSkills) {
    items.push("User-invocable skills are surfaced as slash commands (/<skill-name>). When executed, the skill gets expanded to a full prompt. Use the reader tool to load SKILL.md files when a task lines up with a skill's description.");
  }
  return joinBlocks(["# Session-specific guidance", bullets(items)]);
}

function renderEnvironmentSection(cwd: string, inv: Invocation): string {
  const items: string[] = [];
  items.push(`Primary working directory: ${cwd}`);
  items.push(`Is a git repository: Yes`);
  items.push(`Platform: ${process.platform}`);
  items.push(`Shell: bash`);
  if (inv && typeof inv.modelId === "string") {
    items.push(`You are powered by the model ${inv.modelId}.`);
  }
  return joinBlocks([
    "# Environment",
    "You have been invoked in the following environment: ",
    bullets(items),
  ]);
}

function renderLanguageSection(language: string): string {
  return `# Language\nAlways respond in ${language}. Use ${language} for all explanations, comments, and communications with the user. Technical terms and code identifiers should remain in their original form.`;
}

interface McpInstructionsEntry {
  name: string;
  instructions: string;
}

function renderMcpInstructionsSection(blocks: McpInstructionsEntry[]): string {
  const instructionBlocks = blocks
    .map((entry) => `## ${entry.name}\n${entry.instructions}`)
    .join("\n\n");
  return `# MCP Server Instructions\n\nThe following MCP servers have provided instructions for how to use their tools and resources:\n\n${instructionBlocks}`;
}

async function loadMcpTools(inv: Invocation, cwd: string): Promise<AgentTool[]> {
  const paths = inv.mcp && inv.mcp.length > 0 ? inv.mcp : [cwd];
  const tools: AgentTool[] = [];
  const savedLog = console.log;
  const savedError = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    for (const path of paths) {
      try {
        const servers = loadMCPConfig(path);
        if (servers.length === 0) continue;
        const pool = new MCPClientPool({ servers });
        await pool.connectAll();
        for (const client of pool.getAllClients()) {
          const defs = await client.listTools();
          for (const def of defs) tools.push(createMCPAgentToolFactory(def, client)());
        }
      } catch {
        // swallow per-server failures to keep the session booting
      }
    }
  } finally {
    console.log = savedLog;
    console.error = savedError;
  }
  return tools;
}

/**
 * The cwd-scoped session directory under the workspace `sessions/` root.
 *
 * Sessions are partitioned per working directory (so `--continue` means "the most
 * recent session in THIS directory"). The cwd is slugged — every non-alphanumeric
 * run collapsed to a single dash — and wrapped in `--…--` markers, matching the
 * on-disk layout. Both the conductor (writer) and {@link SessionLibrary} (reader)
 * must agree on this, so it lives here and is shared by the repl runner.
 *
 * @param sessionsRoot the workspace `sessions/` directory
 * @param cwd          the run's working directory
 */
export function sessionScopeDir(sessionsRoot: string, cwd: string): string {
  const slug = cwd.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return join(sessionsRoot, `--${slug}--`);
}

function lastUserTurnStart(messages: Array<{ role: string }>): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}

const condenseTranscript = async (
  messages: Array<{ role: string }>,
  opts?: { model?: unknown; apiKey?: string; signal?: AbortSignal; force?: boolean },
): Promise<Array<{ role: string }>> => {
  const model = opts?.model;
  const deps = model ? {
    model,
    ...opts?.apiKey !== undefined ? { apiKey: opts.apiKey } : {},
    ...opts?.signal !== undefined ? { signal: opts.signal } : {},
  } : {};
  const cleared = clearStaleToolResults(messages as never) as Array<{ role: string }>;
  if (opts?.force) {
    const cut = lastUserTurnStart(cleared);
    if (cut <= 0) return messages;
    const dropped = cleared.slice(0, cut);
    const kept = cleared.slice(cut);
    const summary = await condense(dropped, deps);
    const restored = restoreUnderCountGuard(dropped, kept);
    return [summary.message, ...restored, ...kept];
  }
  const plan = planSlice(cleared, AUTO_CONDENSE_POLICY);
  if (plan.cut === 0 || plan.dropped.length === 0) return messages;
  const summary = await condense(plan.dropped, deps);
  const restored = restoreUnderCountGuard(plan.dropped, plan.kept);
  return [summary.message, ...restored, ...plan.kept];
};

function restoreUnderCountGuard(dropped: unknown[], kept: unknown[]): unknown[] {
  const headroom = dropped.length - 2;
  if (headroom <= 0) return [];
  return rehydrateRecentReads(dropped, kept, { maxFiles: Math.min(5, headroom) });
}

function gatherPermissionRules(store: PreferenceStore): PermissionRule[] {
  const tiers = [store.projectOverrides(), store.globalDefaults()];
  const rules: PermissionRule[] = [];
  for (const tier of tiers) {
    const perms = tier.permissions;
    if (perms === undefined) continue;
    for (const raw of perms.deny ?? []) rules.push(makeRule("deny", raw));
    for (const raw of perms.ask ?? []) rules.push(makeRule("ask", raw));
    for (const raw of perms.allow ?? []) rules.push(makeRule("allow", raw));
  }
  return rules;
}

function resolveDefaultMode(store: PreferenceStore): PermissionMode {
  for (const tier of [store.projectOverrides(), store.globalDefaults()]) {
    const mode = tier.permissions?.defaultMode;
    if (mode !== undefined && isPermissionMode(mode)) return mode;
  }
  return "default";
}

function readOnlyNamesFromDeck(tools: AgentTool[]): Set<string> {
  const names = new Set<string>();
  for (const tool of tools) {
    if (tool.readOnly === true) names.add(tool.name);
  }
  return names;
}

/**
 * Build the `canUseTool` gate factory for a boot run.
 *
 * The factory receives a getter onto the conductor's LIVE permission mode plus the
 * conductor's stable approval delegate, and returns the gate that reads them. The
 * delegate is threaded straight into `requestApproval`: on a NON-interactive boot
 * (oneshot / link) no resolver is ever installed, so the delegate denies and an
 * `ask` decision deterministically denies with an actionable message. The
 * interactive (React) console installs its overlay resolver via the conductor's
 * `setApprovalResolver` AFTER mount, at which point the SAME delegate begins
 * routing `ask` decisions to the overlay — no rebuild, fully additive.
 *
 * `rules` is the session's LIVE mutable rule list: the gate re-scans it on every
 * call, and an `allow-always` approval appends into it (via `appendAllowRule`
 * below), so the approval is remembered for the remainder of the session — and
 * ONLY the session; nothing is ever written back to settings. Every gate the
 * factory mints (and every sub-agent gate built over the same array) sees the
 * appended rules immediately.
 *
 * Exported for the boot tests; product callers go through
 * {@link buildSessionConductor}.
 */
export function buildPermissionGate(
  rules: PermissionRule[],
  mode: PermissionMode,
  tools: readonly AgentTool[],
  planReachable = false,
): ((currentMode: () => PermissionMode, requestApproval?: ApprovalResolver) => CanUseToolFn) | undefined {
  if (rules.length === 0 && mode === "bypass" && !planReachable) {
    return undefined;
  }
  const readOnlyToolNames = readOnlyNamesFromDeck(tools as AgentTool[]);
  return (currentMode, requestApproval) => createPermissionGate({
    rules,
    mode: currentMode,
    ...requestApproval !== undefined ? { requestApproval } : {},
    appendAllowRule: (rule) => rules.push(rule),
    readOnlyToolNames,
  });
}

function resolveOpeningMode(inv: Invocation, store: PreferenceStore): PermissionMode {
  const raw = inv.flags["permission-mode"];
  if (typeof raw === "string" && isPermissionMode(raw)) return raw;
  return resolveDefaultMode(store);
}

export async function buildSessionConductor(ctx: BootContext) {
  primeProviderEnv(ctx);
  const inv = ctx.invocation;
  const modelId = resolveModelId(ctx);
  const workspace = inv.cwd;
  const cwd = workspace ?? process.cwd();
  const sessionsDir = sessionScopeDir(ctx.workspace.sessionsDir, cwd);
  const memDir = memoryDirFor(ctx.workspace, cwd);
  const memoryStore = new DiskMemoryStore(memDir);
  const memoryDoc = loadMemoryDoc(memDir);
  const vault = createAuthVault(ctx.workspace.authPath);
  const getApiKey = buildKeyResolver(ctx, vault, inv.account);
  const gatewayBaseUrls = await resolveServerGatewayUrls(ctx, vault);
  const settings = PreferenceStore.fromWorkspace(ctx.workspace, cwd);
  const permissionRules = gatherPermissionRules(settings);
  const permissionMode = resolveOpeningMode(inv, settings);
  let liveConductor: { permissionMode(): PermissionMode } | undefined;
  const subagentPolicy = {
    rules: permissionRules,
    mode: () => liveConductor?.permissionMode() ?? permissionMode,
  };
  const surveyBriefing = composeBriefing({
    tools: provisionDeck("authoring", { cwd }).tools(),
  });
  const runner = createDelegateRunner({
    modelId,
    getApiKey,
    system: surveyBriefing,
    cwd,
    getGatewayBaseUrls: () => resolveServerGatewayUrls(ctx, vault),
    permissionPolicy: subagentPolicy,
  });
  const workflowRunner = createWorkflowAgentRunner({
    modelId,
    getApiKey,
    cwd,
    getGatewayBaseUrls: () => resolveServerGatewayUrls(ctx, vault),
    permissionPolicy: subagentPolicy,
  });
  const addons = await buildAddonHost(ctx);
  const checkpoint = createCheckpointStore();
  const deck = [
    ...selectTools(cwd, inv, runner, memoryStore, checkpoint, workflowRunner),
    ...(await loadMcpTools(inv, cwd)),
    ...(await loadZohoAgentTools({
      cwd,
      closables: ctx.closables,
      zohoUrl: typeof inv.zohoUrl === "string" ? inv.zohoUrl : typeof inv.flags?.["zoho-url"] === "string" ? inv.flags["zoho-url"] : process.env.ZOHO_MCP_URL,
      noZoho: inv.noZoho === true || inv.flags?.["no-zoho"] === true,
      forceZoho: inv.flags?.zoho === true,
    })),
    ...(await loadSarvamAgentTools({
      cwd,
      closables: ctx.closables,
      sarvamKey: typeof inv.sarvamKey === "string" ? inv.sarvamKey : typeof inv.flags?.["sarvam-key"] === "string" ? inv.flags["sarvam-key"] : process.env.SARVAM_API_KEY,
      noSarvam: inv.noSarvam === true || inv.flags?.["no-sarvam"] === true,
      forceSarvam: inv.flags?.sarvam === true,
      basePath: typeof inv.sarvamBasePath === "string" ? inv.sarvamBasePath : typeof inv.flags?.["sarvam-base-path"] === "string" ? inv.flags["sarvam-base-path"] : undefined,
    })),
  ];
  const tools = wrapToolsWithAddons(concatAddonTools(deck, addons), addons);
  const skills = gatherModelSkills(cwd);
  const system = composeSystem(tools, inv, cwd, skills, memoryDoc);
  const thinking = resolveThinkingLevel(inv.thinking);
  const fallbackModelId = inv.fallbackModelId;
  const planReachable = inv.mode === "repl";
  const canUseTool = buildPermissionGate(permissionRules, permissionMode, tools, planReachable);
  const conductor = createSessionConductor(
    {
      modelId,
      tools,
      system,
      getApiKey,
      sessionsDir,
      permissionMode,
      plansDir: sessionsDir,
      checkpoint,
      ...canUseTool !== undefined ? { canUseTool } : {},
      ...thinking !== undefined ? { thinking } : {},
      ...workspace ? { workspace } : {},
      ...fallbackModelId !== undefined ? { fallbackModelId } : {},
      ...Object.keys(gatewayBaseUrls).length > 0 ? { gatewayBaseUrls } : {},
    },
    { condense: condenseTranscript },
  );
  liveConductor = conductor;
  return conductor;
}

/**
 * The prompts a oneshot run submits: the positional first prompt when present,
 * plus any pass-through tokens that survived flag parsing. Empty when the
 * invocation carried no request text (the caller decides what to do then).
 *
 * @param ctx the boot context carrying the parsed invocation
 */
export function oneshotPrompts(ctx: BootContext): string[] {
  const prompts: string[] = [];
  const head = ctx.invocation.prompt;
  if (head !== undefined && head.length > 0) {
    prompts.push(head);
  }
  return prompts;
}

