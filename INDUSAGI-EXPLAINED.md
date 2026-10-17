# How `indusagi-coding-agent` Works — Complete Beginner's Guide

> A walkthrough of the repo at `~/indusagi-ts/indusagi-coding-agent/` (the npm
> package `indusagi-coding-agent@0.2.5`, AGPL-3.0). Focus is on:
>
> 1. **Compact (token management)** — how the agent keeps its context window from overflowing.
> 2. **The status line UI** you see at the bottom of the terminal — the `0.0%/500k (auto)` line, the model/provider/effort, and the `⏵⏵ Bypass on (shift+tab to cycle)` indicator.
> 3. **Sub-agents** — the `task` card (parallel sub-agent) and the `workflow` card (deterministic JS workflow that itself spawns agents).
>
> File paths below are relative to the repo root and are real files in this codebase (verified).

---

## 0. The two-minute mental model

```
                    ┌─────────────────────────────────────────────┐
                    │  src/entry.ts (bin: `indus`, `indusagi`)    │
                    └──────────────────────┬──────────────────────┘
                                           ▼
                    ┌─────────────────────────────────────────────┐
                    │  src/boot/                                   │
                    │   boot → STAGES → Runner                     │
                    │     repl-runner │ oneshot-runner │ link-runner
                    └──────────────────────┬──────────────────────┘
                                           ▼
   ┌──────────────────────────┐    ┌─────────────────────────────┐
   │ src/window-budget/       │◀──▶│ src/conductor/ (model loop) │
   │  microcompact            │    │  SessionConductor → Agent    │
   │  budget (gate/slice)     │    │  SignalHub → TerminalConsole │
   │  summarize (condense)    │    └──────────────┬──────────────┘
   │  rehydrate               │                   │
   └──────────────────────────┘                   ▼
                    ┌─────────────────────────────┴───────────────────┐
                    │                                                │
                    ▼                                                ▼
   ┌────────────────────────────┐                  ┌──────────────────────────────┐
   │ src/console/ (Ink TUI)     │                  │ src/capability-deck/ (tools) │
   │  TerminalConsole →         │                  │  builtin bridge (read/write/ │
   │  StatusBar + WorkingInd.   │                  │  bash/grep/find/web…)        │
   │  + Composer + slash UI     │                  │  cards: todo / daemon / task │
   └────────────────────────────┘                  │  / workflow / saas / memory  │
                                                  │  / plan                      │
                                                  └──────────────┬───────────────┘
                                                                 ▼
                                                  ┌──────────────────────────────┐
                                                  │ src/workflow-engine/         │
                                                  │  runWorkflow (vm)            │
                                                  │  createWorkflowAgentRunner   │
                                                  └──────────────────────────────┘
```

---

## 1. The thing you see at the bottom of the screen

When you run `indus` (or `indusagi`) in interactive mode, the bottom of the screen shows:

```
  0.0%/500k (auto)                       (minimax) minimax::MiniMax-M3-0.5 • high
  ⏵⏵ Bypass on (shift+tab to cycle)
```

There are **three rows** stacked vertically inside `StatusBar.ts`. Each row is a separate React/Ink element.

### `src/console/components/StatusBar.ts` (48 lines)

- Imports `StatusLine` and `Footer` from the external sibling package `indusagi/react-ink` (line 5). Those components do the **literal rendering** of `0.0%/500k (auto)` and the bottom-most permission chip — they are not in this repo.
- Lines 8–21 `permissionBadge(mode)` — local label logic for the middle row:
  - `acceptEdits` → yellow `● permission: accept-edits`
  - `bypass` / `bypassPermissions` → red `● permission: bypass-permissions`
  - `plan` → cyan `● permission: plan`
  - `default` → gray `● permission: default`
- Line 37: `<StatusLine …>` — top row (token usage).
- Lines 38–45: middle `permissionBadge` row.
- Line 46: `<Footer …>` — bottom row (shift+tab cycle hint).

### How `0.0%/500k (auto)` is computed

The math lives in **`src/console/components/TerminalConsole.ts`**:

- Line 64: `const FALLBACK_CONTEXT_WINDOW = 200000;` (the 200k fallback when a model has no explicit window).
- Lines 96–149 `projectSnapshot()`:
  - `contextWindow = model && model.contextWindow > 0 ? model.contextWindow : FALLBACK_CONTEXT_WINDOW`
  - `usedTokens = snap.contextTokens`
  - `percent = (usedTokens / contextWindow) * 100`
  - `autoCompactEnabled = services.settings.get("autoCompact")` (line 107) — this drives the `(auto)` / `(off)` suffix in the status line.
- The result is packed into a `SessionSnapshot` (with `contextUsage: { tokens, contextWindow, percent }`) and handed to `<StatusBar>` at lines 1067–1074. From there `<StatusLine>` renders the literal text.

### How `(minimax) minimax::MiniMax-M3-0.5 • high` is produced

Same `TerminalConsole.ts projectSnapshot()`:

- Line 114: `model = conductor.model()`
- Line 115: `thinkingLevel = conductor.thinkingLevel()`
- These become `snapshot.model = { provider, id }` and `snapshot.thinkingLevel`. `<StatusLine>` (in `indusagi/react-ink`) formats them into the `(provider) provider::id • effort` string.

### How `⏵⏵ Bypass on (shift+tab to cycle)` is produced

- The bottom-most row is `<Footer>` from `indusagi/react-ink`, which renders the permission chip + the shift+tab hint.
- The corresponding status **toast** ("Permission mode: BYPASS … Shift+Tab to cycle.") is generated by `permissionModeStatusText()` in `TerminalConsole.ts:207-219`, shown when the user cycles modes (`cyclePermission()` at line 313) or on initial non-default mode (line 900).
- The keyboard binding itself: `src/console/input/keymap.ts:119` — `Shift+Tab → mode:cyclePermission`.

### How the status bar updates

- Pure **Redux-style** — `TerminalConsole` holds one `useReducer(consoleReducer, …)` for UI state (line 224), plus an `approvalQueueReducer` (line 245) and several `useState` hooks for ephemeral data.
- The conductor is an **EventEmitter-style signal stream** — `conductor.subscribe((signal) => …)` (line 328). Each signal either dispatches a `ConsoleEvent` to the reducer or calls `pulse()` (line 243, a `forceTick` increment) to force a re-render.
- There is **no polling**. Every status-line number you see comes from a fresh `projectSnapshot()` built during render, which reads `conductor.model()`, `conductor.thinkingLevel()`, `conductor.permissionMode()`, and the latest `snap.contextTokens`.

### Slash commands registered

Full list lives in `src/console/slash/`:

- `transcriptCommands` (`commands/transcript.ts`, 262 lines):
  - `/clear` (alias `/reset`) — clear conversation, new session
  - `/new` — fresh session
  - `/compact` (aliases `/condense`, `/summarize-context`) — manual condense (wires to `condenseTranscript` in `boot/runners/session.ts:428`)
  - `/resume` (alias `/sessions`) — open sessions modal
  - `/session` — show stats
  - `/cost` — show cost/token usage
  - `/branch` (alias `/fork`) — open user-turn fork modal
  - `/timeline` (alias `/tree`) — open transcript tree
  - `/name` — name the current session
  - `/reload` — reload session resources
  - `/quit` and `/exit`
- `workbenchCommands` (`commands/workbench.ts`, 245 lines):
  - `/model` (alias `/models`), `/models-for` (verbs `edit|show|reset`)
  - `/settings`, `/help` (alias `?`), `/keys` (alias `/hotkeys`)
  - `/whats-new` (alias `/changelog`), `/plan`, `/thinking`, `/debug`
- `integrationCommands` (`commands/integrations.ts`, 694 lines):
  - `/login`, `/logout`, `/status`, `/usage`, `/mcp`, `/memory`, `/composio`
  - `/copy` (last reply → clipboard via `pbcopy`/`clip`/`xclip`/`wl-copy`)
  - `/export` (HTML transcript), `/share` (secret GitHub gist via `gh gist create`)
- `dynamicCommands` (`commands/dynamic.ts`, 82 lines) — `.indusagi/skills/` and `.indusagi/commands/` macros become `/skill:<name>` and `/<macroName>`.

Registry glue: `src/console/slash/registry.ts`, `resolve.ts`, `builtins.ts`, `index.ts`.

---

## 2. Token math — how big is the context right now?

Heuristic token meter lives in `src/window-budget/budget/estimate.ts`. It does **not** call a real tokenizer; it estimates from string lengths and block shapes.

### `src/window-budget/budget/estimate.ts`

- `CHARS_PER_TOKEN = 3.6` (the canonical heuristic).
- `IMAGE_TOKENS = 1024`, `MESSAGE_FRAMING_TOKENS = 4`, `BLOCK_FRAMING_TOKENS = 2`, `TOOLCALL_ENVELOPE_TOKENS = 6`.
- Exports:
  - `estimateMessageTokens(message)` — walks blocks by role and block type (`text` / `thinking` / `image` / `toolCall`) and returns an estimate for one message.
  - `estimateTokens(messages)` — sum over the full transcript.
  - `prefixTokens(messages)` — forward cumulative prefix-sum (used by `planSlice` for binary search).

### `src/window-budget/budget/gate.ts`

- `budgetLimit(model, policy) = (contextWindow − reserveTokens) × triggerRatio`.
- `isOverBudget(messages, model, policy) = estimateTokens(messages) > budgetLimit(model, policy)`.
- This is the gate that decides whether to condense.

### `src/window-budget/budget/slice.ts`

- `planSlice(messages, policy): CondensePlan` — builds the prefix-sum, binary-searches for the boundary nearest `total − keepRecent`, then `snapForward` advances past any `toolResult` so a `toolCall` is never split from its `toolResult`.
- Returns `{ dropped: messages[:cut], kept: messages[cut:], cut }`.

### Where these are called

- `src/conductor/conductor.ts:188` — after each turn:
  ```ts
  if ((this.options.autoCompact ?? true) && this.#boundModel && this.store.size > 1
      && isOverBudget(this.agent.state.messages, this.#boundModel, AUTO_CONDENSE_POLICY))
    await this.#runCondense(false);
  ```
- `src/window-budget/condenser.ts:37` — inside `createCondenser`, before deciding to call the LLM.

---

## 3. The compact feature — four layers, ordered by cost

The compact system is **not one thing**. It is a pipeline of four strategies, applied in order of cost. All live under `src/window-budget/`.

### Layer 1 — Microcompact (cheapest, no LLM call)

File: `src/window-budget/microcompact.ts`

- `CLEARED_TOOL_RESULT = "[Old tool result content cleared]"` — the placeholder text.
- `COMPACTABLE_TOOL_NAMES` — a Set: `read`, `grep`, `find`, `ls`, `glob`, `bash`, `websearch`, `webfetch`, `edit`, `write`.
- `DEFAULT_KEEP_RECENT = 6` — keep the most recent 6 compactable tool results verbatim.
- Exports `clearStaleToolResults(messages, { keepRecent? })`.
- Replaces stale tool-result **bodies** with the placeholder; the user-visible tool call / result pairing is preserved.

### Layer 2 — Cache-aware microcompact

Not a separate file in this repo — microcompact in `microcompact.ts` is the only pre-step. (The `cache_edits` style of cache-aware invalidation is handled by the framework `indusagi` package.)

### Layer 3 — Slice & condense via LLM (the expensive one)

File: `src/window-budget/summarize/condense.ts`

- `DIGEST_HEADER = "[session digest — older turns condensed]"`, `BRANCH_HEADER = "[branch digest — archived from a path not taken]"`.
- Exports `summarize(messages, deps)` and `condenseScope(messages, deps)` (branch-archival entry).
- When `deps.complete` is provided → calls it with `reasoning: "high"`, the `CONDENSER_BRIEF` system prompt, and the prompt from `prompt.ts`.
- When `model` is omitted → falls back to a deterministic `# Carryover` digest (`localFallbackDigest`) — no LLM call.

File: `src/window-budget/summarize/prompt.ts`

- `CONDENSER_BRIEF` — the recorder system prompt.
- `TURN_MARK = "»"`, `SECTION_TEMPLATE = ["# Objective", "# Guardrails", "# Status (Shipped / Active / Stuck)", "# Rationale", "# Plan", "# Carryover"]`.
- `flattenTranscript(messages)` — turn-marked transcript.
- `buildSummaryPrompt(messages, scope, priorDigest?)` — wraps in `<carried-digest>` + `<scrollback>` blocks plus the section headings.

### Layer 4 — Rehydrate (re-attach recent reads)

File: `src/window-budget/rehydrate.ts`

- `RESTORED_FILE_PREFIX = "[Restored file after compaction]"`.
- `DEFAULT_MAX_FILES = 5`, `DEFAULT_TOKEN_BUDGET = 8_000`, `DEFAULT_READ_TOOL_NAME = "read"`.
- `rehydrateRecentReads(dropped, kept, { maxFiles?, tokenBudget?, readToolName? })` — re-attaches up to 5 recently-read file bodies as synthetic `user` messages, under an 8k token budget, skipping files still visible in the kept tail.

### Condenser factory (orchestration)

File: `src/window-budget/condenser.ts`

- `AUTO_CONDENSE_POLICY = { triggerRatio: 0.75, keepRecent: 6_000, reserveTokens: 2048 }` — the defaults.
- `createCondenser(deps)` returns a `Condenser` structurally compatible with the conductor's `CondenseFn`. Flow:
  - If no `model` → return input unchanged.
  - If `!isOverBudget` → return unchanged.
  - Else `planSlice(...)` → if `cut === 0` return unchanged → `summarize(plan.dropped, deps)` → return `[summary.message, ...plan.kept]`.

### The actual `CondenseFn` given to the conductor

File: `src/boot/runners/session.ts:428-453` — `condenseTranscript(messages, opts)`

1. `clearStaleToolResults(messages)` — microcompact first.
2. If `opts.force` (manual `/compact`) → cut at `lastUserTurnStart` → condense dropped → prepend summary, restored-file messages, kept tail.
3. Otherwise: `planSlice(cleared, AUTO_CONDENSE_POLICY)` → if `cut === 0` return unchanged → `condense(plan.dropped, deps)` → `restoreUnderCountGuard` (capped at `Math.min(5, dropped.length − 2)`).
4. Line 620: passed to the conductor as `{ condense: condenseTranscript }` inside `createSessionConductor`.

### Reactive vs proactive

Auto-compact is **proactive** — checked at the start of each turn (`conductor.ts:188`). There is **no reactive compact** in this repo (unlike the upstream Claude Code which has a `REACTIVE_COMPACT` feature flag).

### Manual `/compact` slash command

- Registered as a slash command in `src/console/slash/commands/transcript.ts` (`compact` with aliases `condense`, `summarize-context`).
- The actual `condense()` method on the conductor is at `src/conductor/conductor.ts:204`, which calls `#runCondense(true, signal)` and returns a `CondenseOutcome` literal: `"condensed" | "nothing" | "cancelled" | "failed" | "busy"`.

---

## 4. Round-trip: condense → persist → rehydrate → resume

1. **Trigger** (`conductor.ts:188`) — `isOverBudget(messages, model, AUTO_CONDENSE_POLICY)` after a turn.
2. **Condense** (`session.ts:428 condenseTranscript`) — `clearStaleToolResults` → `planSlice` (or last-user-cut if forced) → `condense` (LLM digest via `summarize/condense.ts`) → `rehydrateRecentReads` (up to 5 recent file bodies under an 8k token budget).
3. **Apply** (`conductor.ts:208 #runCondense`) — `agent.replaceMessages(after)` → `store.reset()` → re-append each message; the **first entry is tagged `TranscriptRole = "condense"`** so the persisted file marks the seam. Emits `kind: "compacted"` hub signal with `manual: force`.
4. **Persist** — entries land in NDJSON via `transcript-store`. `serialize.ts:17-18` maps `compactionSummary` and `branchSummary` agent-message roles → persisted `"condense"` transcript role. Header `[session digest — older turns condensed]` lives inside the message itself.
5. **Resume** — `repl-runner.ts` → `conductor.resume(id)` (conductor.ts:231) calls `store.load` then `agent.replaceMessages(store.messages())`. The summary message is restored as a normal `user`-role message; the model sees the digest on the first turn after resume. There is **no special "uncompaction" path** — re-attached files come back only if they were referenced by tool-calls still present in the kept tail via `rehydrateRecentReads` (run at condense time, not resume time).

---

## 5. Settings & config

### `src/settings/manager.ts` (109 lines)

- `PreferenceStore` — two-tier: global `~/.indusagi/agent/settings.json` + project `<cwd>/.indusagi/settings.json`.
- `PreferenceStore.fromWorkspace(workspace, cwd)` → factory.
- `get<K>(key)`, `set<K>(key, value)` (writes to project tier), `snapshot()`, `projectOverrides()`, `globalDefaults()`, `save()`, `reload()`, `paths()`.

### `src/settings/contract.ts`

- `Preferences`, `SettingKey`, `DEFAULT_PREFERENCES`, `PERMISSION_MODES = { default, acceptEdits, bypass, plan }` (plus `isPermissionMode`), `ESCAPE_ACTIONS`, `DELIVERY_MODES`.

### Surfaced in the UI

`src/console/overlays/pickers.ts` — the `settings` modal. Toggle rows include:
- `colourScheme`, `showImages`, `imageAutoResize`, `blockImages`, `showReasoning`, `enableSkillCommands`, `steeringMode`, `followUpMode`, **`autoCompact`** (line 209), `collapseChangelog`, `quietStartup`, `logoSweep`, `reducedMotion`, `showHardwareCursor`, `editorPaddingX`.

### Env vars

There are **no env vars for compact** in this repo (no `DISABLE_COMPACT` / `DISABLE_AUTO_COMPACT` / `*_AUTO_COMPACT_WINDOW` / `*_MAX_CONTEXT_TOKENS`). The only knob is the **`autoCompact` boolean setting** (default `true`), toggleable from the settings modal.

The only env vars that matter for token management are read by the framework `indusagi` package (not this repo).

---

## 6. Sub-agents — the `task` card and the `workflow` card

When the model invokes a tool that delegates work, two distinct mechanisms exist. There is **no `AgentTool` / `subagent_type` parameter** in this repo — that idiom is upstream Claude Code. Instead, indusagi exposes two "cards":

### `task` card — single-objective sub-agent

File: `src/capability-deck/cards/task-card.ts`

- `taskCard` — wraps the `DelegateRunner` injected via the framework handle `DELEGATE_HANDLE_KEY = "delegate"`.
- Falls back to a typed stub when the handle is absent.

File: `src/boot/runners/delegate-runner.ts` (lines 221–294)

- `createDelegateRunner(opts) → DelegateRunner`.
- `MAX_PARALLEL_TASKS = 2` — concurrency limiter.
- `MAX_REPORT_CHARS = 48000`.
- Per call (`run({ objective, context }, signal, onProgress)`):
  1. Allocates a slot.
  2. Spawns a **fresh `Agent`** with the **`authoring` deck** (recursion guard: sub-agents cannot themselves use `task`).
  3. Submits one prompt `${objective}\n\nContext:\n${context}`.
  4. Streams progress (token count + last 14 activity entries) via `DelegateProgress`.
  5. Returns `{ ok, report: clampReport(...) }`.
- Cancellation forwarded via `signal`.

### `workflow` card — deterministic JS script that spawns agents

File: `src/capability-deck/cards/workflow-card.ts`

- `workflowCard` — wraps `WORKFLOW_HANDLE_KEY = "workflow"` → `runWorkflow` engine.
- Same recursion guard via the `authoring` deck (no nested workflows).
- Live `◆ Workflow:` progress tree via `onUpdate`.

File: `src/workflow-engine/engine.ts`

- `runWorkflow<T>(script, options) → Promise<WorkflowRunResult<T>>`.
- Parses with `parseWorkflowScript`, executes inside `node:vm`, runs `agent(prompt, opts)`, `parallel(...)`, `pipeline(...)`.
- `WORKFLOW_RUNTIME_BUDGET_MS = 1000`.
- Lifecycle callbacks: `onLog`, `onPhase`, `onAgentStart`, `onAgentEnd`, `onAgentActivity`.
- Token accounting: total budget + spent + remaining.

File: `src/workflow-engine/agent-runner.ts` (lines 93–…)

- `createWorkflowAgentRunner(opts) → WorkflowAgentRunner`.
- Per call: resolves model via `ModelMatcher`, provisions the `authoring` deck (excluding `workflow` for recursion), adds the `structured_output` tool when `options.schema` is supplied, spawns `new Agent({ initialState: { model, systemPrompt, tools }, getApiKey?, canUseTool: createSubagentPermissionGate(...) })`.

File: `src/workflow-engine/parse.ts`

- `parseWorkflowScript(script) → { meta: WorkflowMeta, body }`.
- `NONDETERMINISM_ERROR` thrown when the script references disallowed globals (`require`, `process`, etc.).

File: `src/workflow-engine/structured-output.ts`

- `createStructuredOutputTool({ schema, capture })` — the "final action" capture tool a workflow sub-agent must call to return its result.

File: `src/workflow-engine/display.ts`

- `createWorkflowSnapshot`, `preview`, `recomputeWorkflowSnapshot`, `renderWorkflowLines`, `renderWorkflowText`.
- Status coalescing (phase / agent start / agent end) to avoid render thrash.

### UI: background agents panel

File: `src/console/components/BackgroundAgents.ts` (154 lines)

- Always-visible panel pinned below the `StatusBar`.
- `deriveAgentRuns(messages)` (line 31) walks the transcript and produces `AgentRun[]`.
- Renders one row per active agent: `◐ name  objective  status`.
- Returns `null` when no agent is running.

File: `src/console/components/AgentsView.ts` (164 lines)

- Drill-in full-screen view triggered by Left-arrow on an empty composer (`TerminalConsole.ts:712`).
- Selectable list with `main` + each run. `↑/↓ select · Enter to view · Enter on main / Esc to return`.

### Other cards worth knowing about

In catalog order (`src/capability-deck/cards/index.ts:106-115`):

1. `todoCard` (`todo-card.ts`) — in-memory checklist (`TodoState`: `pending|active|done|dropped`). Read/set only.
2. `daemonCard` (`bg-process-card.ts`) — long-lived child processes via `node:child_process.spawn`. Output captured into bounded ring buffers (`MAX_BUFFERED_LINES = 2000`). Stop escalates `SIGTERM → SIGKILL`.
3. `taskCard` — sub-agent (see above).
4. `workflowCard` — JS workflow (see above).
5. `saasCard` (`saas-card.ts`) — Composio-style SaaS gateway wrapper. `discover` / `execute` verbs.
6. `memoryCard` (`memory-card.ts`) — `read` / `replace` / `append` working-memory note. Boot wires `DiskMemoryStore`.
7. `enterPlanModeCard` + `exitPlanModeCard` (`plan-tools.ts`) — read-only tools that return `{ enterPlanMode: true }` / `{ exitPlan: true, plan }`. The **conductor** intercepts (not the tool) to flip permission mode, restore pre-plan mode, persist plan file.

---

## 7. The end-to-end flow — what happens on each turn

1. You press Enter on a prompt in the Ink REPL.
2. `TerminalConsole` (Ink) dispatches the prompt via `services` (or directly through the composer).
3. `conductor.submit(input)` runs `#runTurn`:
   1. Retries with backoff (`DEFAULT_RETRY = { maxAttempts: 2, baseDelayMs: 250 }`).
   2. Subscribes to `agent` events through `translateAgentEvent` → `SessionSignal[]` → `SignalHub` for the UI.
   3. Persists each message via `store.append` (NDJSON on disk, cwd-scoped).
   4. Persists usage.
   5. **Auto-condenses** when `isOverBudget(...)` — `condenseTranscript` from `boot/runners/session.ts:428`.
   6. Dispatches `phase`, `head`, `settled` actions through `reduceState`.
4. If the model invoked the `task` tool → `DelegateRunner` spawns a fresh agent (slot-limited to 2).
5. If the model invoked the `workflow` tool → `WorkflowAgentRunner` runs the script in `node:vm`.
6. The status bar re-renders. If you're near the limit, `0.0%/500k (auto)` updates live.

---

## 8. File-by-file quick reference

### Entry / boot

| File | What it does |
|------|--------------|
| `src/entry.ts` | Top-level executable. Sets `process.title`, installs MCP-noise filter, calls `ensureHeapHeadroom()`, then `boot(argv.slice(2))`. |
| `src/index.ts` | Barrel re-exporting every subsystem as namespaces. |
| `src/boot/boot.ts` | Boot orchestrator. `boot(argv)` seeds a `BootContext`, short-circuits on help/version/login/list-models, then `runStages` and dispatches to the chosen `Runner`. |
| `src/boot/stages.ts` | Ordered `STAGES` array: `locate-workspace`, `apply-upgrades`, `build-invocation`, `resolve-resources`, `select-runner` (marker). |
| `src/boot/heap.ts` | `ensureHeapHeadroom()` re-execs with `--max-old-space-size=4096` (or `INDUS_MAX_HEAP_MB`). |
| `src/boot/auth-vault.ts` | `createAuthVault(authPath)` — JSON-file-backed `auth.json` with OAuth refresh. |
| `src/boot/server-token.ts` | Disk persistence for the indus device-login session token. |
| `src/boot/invocation.ts` | `tokenizeInvocation(argv)` — calls `launch.readInvocation` and projects onto thin boot `Invocation`. |
| `src/boot/runners/registry.ts` | `RUNNERS = [replRunner, oneshotRunner, linkRunner]`. |
| `src/boot/runners/repl-runner.ts` | Interactive runner. Calls `buildSessionConductor(ctx)`, `applyResume`, `buildOverlayServices`, then `mountConsole(conductor, …)`. |
| `src/boot/runners/oneshot-runner.ts` | Non-interactive runner. Returns `EXIT_NO_INPUT = 2` when no prompt. |
| `src/boot/runners/link-runner.ts` | Headless JSON-RPC. `createLinkServer(SESSION_OPS, conductor, …)`. |
| `src/boot/runners/session.ts` | Largest boot helper. `buildSessionConductor(ctx)`, `selectTools`, `composeSystem`, `gatherModelSkills`, `resolveModelId`, `sessionScopeDir`, `buildPermissionGate`, `oneshotPrompts`, **`condenseTranscript`** (line 428). |
| `src/boot/runners/delegate-runner.ts` | `createDelegateRunner` — `task` card runner. `MAX_PARALLEL_TASKS = 2`. |
| `src/boot/runners/memdir.ts` | `memoryDirFor`, `DiskMemoryStore`. |
| `src/boot/runners/checkpoint.ts` | Per-session file-checkpoint store (pre-edit snapshots). |
| `src/boot/runners/read-state.ts` | Read-before-edit gate state (`ReadStateStore`). |
| `src/boot/runners/addon-wiring.ts` | `buildAddonHost`, `wrapToolsWithAddons`, `concatAddonTools`. |
| `src/boot/runners/server-mode.ts` | `isGatewayEligibleProvider`, `resolveServerMode`, `resolveServerGatewayUrls`. |

### Conductor (model-call loop)

| File | What it does |
|------|--------------|
| `src/conductor/conductor.ts` | The main loop. `createSessionConductor(options, deps)` → `SessionConductorImpl`. `submit` / `#runTurn` / `#runCondense` / `condense` / `resume` / `cyclePermissionMode` etc. Auto-compact trigger at line 188. |
| `src/conductor/contract.ts` | Frozen contract. `SessionSignal`, `TranscriptSchema`, `ConductorPhase`, `SessionConductor`, `CondenseOutcome`, `PermissionMode`, etc. |
| `src/conductor/bash-guard.ts` | Quote-aware shell parser. Always-deny blocklist (fork bombs, `rm -rf /`, etc.). |
| `src/conductor/permissions.ts` | Two-layer engine: rule engine + `createPermissionGate` + `createSubagentPermissionGate`. |
| `src/conductor/quota-error.ts` | `isQuotaFault`, `quotaErrorMessage` for indus-plan-exhausted. |
| `src/conductor/diagnostics.ts` | `DiagnosticsEngine` for `tsc` + `eslint`. |
| `src/conductor/catalog/catalog.ts` | `ModelCatalog` — wraps `getProviders` / `getModels`. |
| `src/conductor/catalog/matcher.ts` | `ModelMatcher` — scoring (exact canonical 900 → alias substring 200). |
| `src/conductor/signal-hub/hub.ts` | `SignalHub` — EventEmitter for `SessionSignal`. |
| `src/conductor/signal-hub/translate.ts` | `TRANSLATOR_TABLE` — maps framework `AgentEvent` types to `SessionSignal[]`. |
| `src/conductor/skill-parse/parse.ts` | `parseSkillInvocation(input)` — detects `/skill-name`. |
| `src/conductor/transcript-store/store.ts` | `TranscriptStore` (memory + fs backends). ULID-keyed DAG. |
| `src/conductor/transcript-store/serialize.ts` | NDJSON codec. Maps agent roles → persisted `"condense"` role. |

### Window budget (compact — full list)

| File | What it does |
|------|--------------|
| `src/window-budget/index.ts` | Public barrel. |
| `src/window-budget/contract.ts` | Frozen types: `BudgetPolicy`, `CondensePlan`, `Condenser`, etc. |
| `src/window-budget/condenser.ts` | Factory. `AUTO_CONDENSE_POLICY = { triggerRatio: 0.75, keepRecent: 6_000, reserveTokens: 2048 }`. |
| `src/window-budget/microcompact.ts` | Cheap tool-result clearing. `CLEARED_TOOL_RESULT`, `COMPACTABLE_TOOL_NAMES`, `DEFAULT_KEEP_RECENT = 6`. |
| `src/window-budget/rehydrate.ts` | Re-attach up to 5 recent reads under 8k budget. `RESTORED_FILE_PREFIX`. |
| `src/window-budget/budget/estimate.ts` | Heuristic token meter. `CHARS_PER_TOKEN = 3.6`. |
| `src/window-budget/budget/gate.ts` | `isOverBudget`, `budgetLimit`. |
| `src/window-budget/budget/slice.ts` | `planSlice` — prefix-sum + binary-search boundary. |
| `src/window-budget/summarize/condense.ts` | LLM digest. `DIGEST_HEADER`, `BRANCH_HEADER`. |
| `src/window-budget/summarize/prompt.ts` | `CONDENSER_BRIEF`, `SECTION_TEMPLATE`, `flattenTranscript`, `buildSummaryPrompt`. |

### Console (TUI — full list)

| File | What it does |
|------|--------------|
| `src/console/mount.ts` | `mountConsole(conductor, opts)` — Ink `render(createElement(TerminalConsole, props))`. |
| `src/console/startup.ts` | `gatherStartup`, `gatherChangelog` — reads `AGENTS.md`/`CLAUDE.md`, skills, changelog. |
| `src/console/components/TerminalConsole.ts` | Top-level Ink app. 1089 lines. `useReducer(consoleReducer, …)`, `conductor.subscribe`, `projectSnapshot`. The math behind `0.0%/500k (auto)`. |
| `src/console/components/StatusBar.ts` | 48 lines. Composes `<StatusLine>` + permission badge row + `<Footer>` from `indusagi/react-ink`. |
| `src/console/components/WorkingIndicator.ts` | Live spinner + "Cogitating"/"Pondering"/"Compacting context" etc. Returns null when `busy=false`. |
| `src/console/components/Banner.ts` | "IndusCode Saffron" masthead (quiet/compact/welcome). |
| `src/console/components/banner-sweep.ts` | Helpers: `welcomeLine`, `rowGradient`. |
| `src/console/components/welcome.ts` | `MASCOTS`, `TIPS`, `WHATS_NEW`, `pickWelcomeVariant`. |
| `src/console/components/Composer.ts` | Bottom prompt surface. `› ` + buffer with caret + suggestions. |
| `src/console/components/AgentsView.ts` | Drill-in sub-agent view (Left on empty composer). |
| `src/console/components/BackgroundAgents.ts` | Always-visible sub-agent panel pinned below `StatusBar`. |
| `src/console/reducer.ts` | `consoleReducer`, `initConsoleState`. |
| `src/console/theme/{tokens,palette,resolve,adapter,index}.ts` | Theme subsystem. |
| `src/console/slash/registry.ts`, `builtins.ts`, `resolve.ts`, `index.ts` | Slash registry. |
| `src/console/slash/commands/transcript.ts` | `/clear`, `/new`, `/compact`, `/resume`, `/session`, `/cost`, `/branch`, `/timeline`, `/name`, `/reload`, `/quit`, `/exit`. |
| `src/console/slash/commands/workbench.ts` | `/model`, `/models-for`, `/settings`, `/help`, `/keys`, `/whats-new`, `/plan`, `/thinking`, `/debug`. |
| `src/console/slash/commands/integrations.ts` | `/login`, `/logout`, `/status`, `/usage`, `/mcp`, `/memory`, `/composio`, `/copy`, `/export`, `/share`. |
| `src/console/slash/commands/dynamic.ts` | `/skill:<name>`, `/<macroName>` from `.indusagi/skills/` and `.indusagi/commands/`. |
| `src/console/overlays/{host,approval,auth,pickers,sessions}.ts` | Modal overlays. `pickers.ts` includes the `settings` modal with the `autoCompact` toggle. |
| `src/console/input/{keymap,paste,complete,dir-reader,index}.ts` | Input subsystem. `keymap.ts:119` — `Shift+Tab → mode:cyclePermission`. |

### Capability deck (tools / cards)

| File | What it does |
|------|--------------|
| `src/capability-deck/contract.ts` | Frozen types. `Capability`, `CapabilityCard`, `DeckProfile`, `ToolDeck`. |
| `src/capability-deck/manifest.ts` | `CAPABILITY_CARDS` — single source of truth. |
| `src/capability-deck/provision.ts` | `provisionDeck(profile, ctx) → ToolDeck`. Profiles: `authoring`/`survey`/`all`. |
| `src/capability-deck/builtin-bridge.ts` | `BUILTIN_BRIDGE` — wire tool names → framework factories. |
| `src/capability-deck/cards/index.ts` | `APP_NOVEL_CARDS` list (in catalog order). |
| `src/capability-deck/cards/todo-card.ts` | In-memory checklist. |
| `src/capability-deck/cards/bg-process-card.ts` | Long-lived child processes (`MAX_BUFFERED_LINES = 2000`). |
| `src/capability-deck/cards/task-card.ts` | Sub-agent (wraps `DelegateRunner`). |
| `src/capability-deck/cards/workflow-card.ts` | JS workflow (wraps `runWorkflow`). |
| `src/capability-deck/cards/saas-card.ts` | Composio-style SaaS gateway. |
| `src/capability-deck/cards/memory-card.ts` | Working-memory `read`/`replace`/`append`. |
| `src/capability-deck/cards/plan-tools.ts` | `enterPlanMode` / `exitPlanMode` (conductor-intercepted). |
| `src/capability-deck/cards/plan-file.ts` | Plan persistence helpers. |
| `src/capability-deck/bridge-ledger/{ledger,key,network,index}.ts` | Event-sourced MCP enrollment. |

### Workflow engine (sub-agents — full list)

| File | What it does |
|------|--------------|
| `src/workflow-engine/index.ts` | Public barrel. |
| `src/workflow-engine/engine.ts` | `runWorkflow<T>(script, options)` — `vm`-hosted. |
| `src/workflow-engine/agent-runner.ts` | `createWorkflowAgentRunner(opts)`. |
| `src/workflow-engine/parse.ts` | `parseWorkflowScript(script)`. |
| `src/workflow-engine/display.ts` | Snapshot/display helpers. |
| `src/workflow-engine/structured-output.ts` | `createStructuredOutputTool({ schema, capture })`. |

### Settings / Workspace / Launch / Sessions

| File | What it does |
|------|--------------|
| `src/settings/index.ts` | Barrel. |
| `src/settings/manager.ts` | `PreferenceStore` — two-tier settings. |
| `src/settings/contract.ts` | `Preferences`, `SettingKey`, `DEFAULT_PREFERENCES`, `PERMISSION_MODES`. |
| `src/workspace/index.ts` | Barrel. |
| `src/workspace/locator.ts` | `createWorkspace(overrides?) → Workspace`. Layout: `profileDir`, `settings.json`, `auth.json`, `sessions/`, `models.json`, `bin/`, `prompts/`, `themes/`, `export-template/`, `debug.log`, `mcp-servers.json`, `memory.json`, `composio.json`, `zoho.json`, `memory.db`. |
| `src/workspace/brand.ts` | `BRAND = { name: "indusagi", binNames: ["indus", "indusagi"], envPrefix: "INDUSAGI", … }`. |
| `src/workspace/runtime-detect.ts` | `isPackagedBinary`, `resolvePackageRoot`. |
| `src/launch/index.ts` | Barrel. |
| `src/launch/catalog.ts` | `printModelCatalog(filter?)`. |
| `src/launch/credentials.ts` | `runCredentialCommand`, `formatCredentialFault`. |
| `src/launch/login.ts` | `runLogin`. |
| `src/launch/oauth.ts` | `listLoginProviders`, `openLoginUrl`, `startOAuthLogin`. |
| `src/launch/packages.ts` | `runPackageCommand`. |
| `src/launch/pickers.ts` | `pickResumeTarget`. |
| `src/launch/invocation/{flags,read,attachments,usage,index}.ts` | Phase-10 flag parser. |
| `src/sessions/library.ts` | `SessionLibrary` — `list`, `open`, `rename`, `remove`, `pathOf`, `tree`, `priorTurns`. |
| `src/sessions/contract.ts` | `BranchNode`, `PriorTurn`, `SavedSession`. |

### Briefing (system prompt construction)

| File | What it does |
|------|--------------|
| `src/briefing/index.ts` | Barrel. |
| `src/briefing/compose.ts` | `composeBriefing({ tools, contextDocs, skills })`. |
| `src/briefing/context-docs.ts` | `gatherContextDocs(cwd, home)` — collects `ContextDoc` (CLAUDE.md, README, etc.). |
| `src/briefing/macros.ts` | Single-pass `$arg` macro scanner/loader. |
| `src/briefing/skills.ts` | Agent-Skills loader. `SKILL_MANIFEST = "SKILL.md"`. |

### Channels / Runtime bridge / Addons / Insight / Transcript

| File | What it does |
|------|--------------|
| `src/channels/contract.ts` | Frozen types. `OpRequest`, `ReplyOk`, `OneshotShape`, `LinkDriver`. |
| `src/channels/framer.ts` | `ndjsonFramer` (NDJSON encode/decode). |
| `src/channels/ops.ts` | `dispatch`, `hasOp`, `buildOps`, `UnknownOpError`. |
| `src/channels/oneshot.ts` | `runOneshot(ctx, opts)`. Strategies: `textStrategy`, `ndjsonStrategy`. |
| `src/channels/session-ops.ts` | `SESSION_OPS` declarative operation registry. |
| `src/channels/link/dialog.ts` | `createDialogBridge`, `DIALOG_TABLE`. |
| `src/channels/link/driver.ts` | `createLinkDriver` (client side). |
| `src/channels/link/server.ts` | `createLinkServer` (server side). |
| `src/runtime-bridge/contract.ts` | `RuntimeAdapterId`, `RuntimeBridge`, `RuntimeBroker`, `RuntimeRoute`. |
| `src/runtime-bridge/sink.ts` | `createBridgeSink`. |
| `src/runtime-bridge/broker.ts` | `createRuntimeBroker` — routes to external CLI or framework `streamSimple`. |
| `src/runtime-bridge/bridges/claude-cli.ts` | `claudeCliBridge` (Anthropic-flavoured CLI). |
| `src/runtime-bridge/bridges/codex-cli.ts` | `codexCliBridge` (OpenAI-flavoured CLI). |
| `src/runtime-bridge/bridges/indusagi-cli.ts` | `indusagiCliBridge` (peer JSON-RPC CLI). |
| `src/runtime-bridge/bridges/builtins.ts` | `BUILTIN_RUNTIME_SPECS`, `BUILTIN_ADAPTERS`, `withRuntimeEndpoint`. |
| `src/runtime-bridge/bridges/_drive.ts` | `driveExchange`, `seedFromModel`. |
| `src/addons/contract.ts` | `AddonManifest`, `AddonSurface`, `HookKind`, `ToolInterceptor`, `ADDONS_DIR = ".indus/addons"`. |
| `src/addons/sandbox.ts` | Jiti-backed loader. |
| `src/addons/manifest.ts` | `discoverAddons`, `discoverSources`. |
| `src/addons/surface.ts` | `createSurface` — per-addon recording surface. |
| `src/addons/host.ts` | `createAddonHost`, `AddonHost`. |
| `src/insight/contract.ts` | `TrailRecorder`, `Probe`, `Sink`, `SecretRedactor`. |
| `src/insight/sampling.ts` | `alwaysGate`, `ratioGate`, `hash32`, `trailScore`. |
| `src/insight/channel.ts` | `createChannel`. |
| `src/insight/recorder.ts` | `createRecorder({ service?, enabled?, gate?, redactor?, sinks?, now? })`. |
| `src/insight/serialize.ts` | `encodeRecord`, `decodeRecord`. |
| `src/insight/redaction.ts` | `createRedactor`, `DEFAULT_REDACTOR`, `DEFAULT_REDACTION_RULES`. |
| `src/insight/sinks/console.ts` | `createConsoleSink`. |
| `src/insight/sinks/file.ts` | `createFileSink`. |
| `src/insight/sinks/stream.ts` | `createStreamSink`. |
| `src/insight/replay.ts` | `replaySignals`, `replayProbes`. |
| `src/transcript-export/publish.ts` | `publishTranscript(entries, options)` → standalone HTML (uses `marked`, `highlight.js`). |
| `src/transcript-export/sgr.ts` | Terminal-styled output → safe HTML spans. |
| `src/transcript-export/template.ts` | `PAGE_SHELL`, `PAGE_STYLES`, `CLIENT_SCRIPT`. |
| `src/transcript-export/theme-bridge.ts` | `DefaultThemeBridge`, `createThemeBridge`. |

---

## 9. Notes on assumptions and what's NOT in this repo

- The previous version of this file referenced `induscode/` paths (e.g. `src/query.ts`, `src/services/compact/...`, `src/utils/tokens.ts`). Those files do **not exist** in this repo. The `induscode` project lives elsewhere — this repo is a separate (newer) agent codebase with a completely different architecture (subsystem barrels, `window-budget` instead of `compact` services, `task`/`workflow` cards instead of `AgentTool`/`subagent_type`).
- The literal `0.0%/500k (auto)` rendering lives in the sibling `indusagi/react-ink` package, **not** in this repo. This repo only computes the numbers (in `TerminalConsole.ts:96-149`) and the `autoCompactEnabled` flag (line 107).
- There are **no env vars** for compact in this repo (no `DISABLE_COMPACT` / `DISABLE_AUTO_COMPACT` / `*_AUTO_COMPACT_WINDOW` / `*_MAX_CONTEXT_TOKENS`). The only knob is the `autoCompact` boolean setting (default `true`).
- There is **no reactive compact** — only proactive (checked at start of each turn).
- There is **no `AgentTool` / `subagent_type` parameter**. Sub-agents are dispatched via the `task` and `workflow` cards.
- There is **no cache-aware microcompact** as a separate file. Microcompact is the single pre-step (`window-budget/microcompact.ts`); cache-aware invalidation is delegated to the framework.