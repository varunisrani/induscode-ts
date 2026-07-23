# Changelog

## [0.2.4]

### Added
- **Ctrl+X — Run Queued Message Now**: during a long (or stuck) run, Ctrl+X promotes the newest queued message — the in-flight turn is terminated cleanly (no error toast, spinner stays up), the rest of the queue survives, and the promoted message runs immediately. Chosen over another Alt/Option chord because Ctrl+X is a plain control byte every terminal delivers identically; Alt+Up still restores a queued message to the composer. Documented in `/keys` and the queued-messages panel.
- **Session-Remembered Approvals**: choosing "allow always" on a permission prompt now genuinely remembers the approval for the rest of the session (it previously acted as "allow once"). Bash approvals are scoped per sub-command — approving `npm test` never whitelists the whole shell — and the prompt shows exactly what will be remembered. Never persisted to settings.
- **Sub-Agent Permission Gating**: `task`-tool delegations and `workflow` subagents now enforce the same permission rules and the LIVE permission mode as the main session (previously they ran fully ungated — a delegation in default mode could edit files and run bash with zero prompts). Inside a subagent an `ask` denies with a clear message; bypass/acceptEdits behave as before.
- **`--permission-mode` Flag**: opt a headless run (`--print` / `--json`) into `acceptEdits`/`bypass` explicitly; precedence is flag > settings `defaultMode` > `default`.
- **Post-Compact Fresh Screen**: a manual `/compact` now presents as a new session that inherits the context — the transcript view resets to the welcome card, a one-shot note lists exactly which files were carried into the condensed context, and the ↑/↓ token, cache, and $ counters reset to zero. Auto-compaction keeps the running view and totals.
- **Cancellable `/compact`**: the busy status reads "Compacting conversation context... Press Esc to cancel." — Esc discards the digest and leaves the transcript untouched. Outcomes are reported honestly: "Nothing to compact yet.", "Compaction cancelled.", and a busy-turn guard, instead of always claiming success.
- **Interactive Server-Tier Sign-In**: `/login` lists "Indus Server" — the device-flow login runs inside the session, and gateway routing takes effect on the very next turn (no restart), for the main agent AND subagents.

### Fixed
- **Agent Continuing After Its Final Report** (#15): the post-edit diagnostics feedback loop could re-prompt the model forever with the same unfixable lint error — each diagnostic is now delivered at most once per session with a hard cap of 3 consecutive auto-follow-ups per user prompt; the busy spinner stays up across auto-drained turns; Esc aborts the queue too.
- **`/compact` UI** (#16): a real "Compacting context" spinner during the run (completion was previously announced the instant work began), the phase no longer wedges the UI until the next message, and auto-compaction is labelled as automatic so it can't be mistaken for a user action.
- **Compaction Auth on Server Tier**: the condense summarizer's model call now authenticates through the session's credential resolver (server-tier `/compact` failed every time — previously masked by the dishonest "condensed" report).
- **Multi-Line Paste** (#18): pasted `\r`/`\r\n` line endings are normalized (raw carriage returns previously wrecked the composer rendering); pastes up to 10 lines show inline as real multi-line text; a big paste split across terminal reads assembles into ONE growing `[Pasted text #N +K lines]` marker (up to 1,000 lines, then rolls into a fresh marker) instead of shredding into fragments.
- **Default Mode Not Prompting**: a rule-less headless boot silently ran allow-all (skipping even the catastrophic-command blocklist) — a gate now always exists outside explicit bypass, and a headless `ask` denies with actionable guidance.
- **Mid-Run Mode Switching**: Shift+Tab now works while a permission prompt is on screen; cycling into bypass releases the parked prompt so the run resumes immediately; approval outcomes are fail-closed (only an explicit allow ever runs a tool).
- **Model Pickers & Status Show Only Callable Models**: `/model`, the banner, and the footer no longer list or display models from unauthenticated providers (previously the whole ~700-model catalog appeared); server-tier sign-in counts immediately; fixed the doubled provider prefix (`minimax/minimax/…`).
- **Subagent Gateway Routing** (#22): task/workflow subagents on server-tier models route through the indus gateway with a fresh per-call lookup (they previously sent the session token straight to the provider and got 401s).

### Changed
- **`/compact` Canonical Name**: the command is now named `/compact` (shown in the suggestion list); `/condense` and `/summarize-context` remain as aliases.
- **Version Bump**: Updated package version to `0.2.4`; framework dependency to `indusagi@^0.13.3`.

## [0.2.3]

### Added
- **IndusCode Saffron Theme**: a new `saffron` colour scheme — saffron primary, teal accent, cream text — now the default, wired through the theme engine and the `/theme` picker.
- **Welcome Card**: a boxed saffron startup card with the `● IndusCode v…` brand label, a block-art robot mascot, the bound model + working directory, a rotating "getting started" tip, and a "What's new" list — the mascot and tip vary per session.
- **Startup & Chat Masthead**: once the first message is sent, the welcome card gives way to the `INDUS CODE` wordmark, the `indus console v…` line, and a bordered Session panel, with the conversation below.
- **Saffron Settings / Model Pickers**: `/settings` and `/model` restyled to the design — a tab-pill header, a teal-bordered search box with a magnifier + caret, a two-column list with type-tinted values (on/true → green, off/false → dim, else → teal), and a key-hint footer.
- **Saffron Slash Menu**: the command autocomplete is now a two-column grid (teal command names + dim descriptions, with the selected row marked), plus a teal `›` prompt and a right-pinned `↵ send` hint.
- **Background Agents Panel**: a live panel pinned below the input listing each delegated sub-agent (`task` tool) under a `● main` header — a status dot (running / done / error), the agent name, a one-line objective, and a live **time + token** count.
- **Drill-In Subagent View**: press **←** on an empty prompt to open a navigable view of `main` + each sub-agent (↑/↓ to move) that live-previews the selected sub-agent's reasoning and tool activity; **Esc**, or `main` + **Enter**, returns to the session.
- **Live Sub-Agent Progress**: the `task` tool streams its sub-agent's cumulative token spend and activity stream (reasoning + tool steps) back to the panel and drill-in view.
- **Expandable Tool Output**: **Ctrl+O** toggles a tool between its 2–3 line summary and a ~20-line expanded view (with a `ctrl+o to expand` hint on the overflow marker).

### Changed
- **Concise Tool Output**: tool results are collapsed to 2–3 lines by default (was up to 10); use **Ctrl+O** to expand.
- **Tool UI Grammar**: every tool call renders with the saffron `●` dot + bold name + `(arg)` + `└` connector (via the `indusagi@0.13.2` `react-ink` `ToolEventBlock`).
- **Tool Activity Panel Disabled**: the live "Tool Activity" panel is turned off (tool calls already render inline) — re-enable via the `SHOW_TOOL_ACTIVITY` flag.
- **Workflow Tool Disabled**: the multi-agent `workflow` tool is hidden from the model for now via the `WORKFLOW_TOOL_ENABLED` flag — the card and the whole `workflow-engine` stay intact.
- **Single-Source Version**: the `VERSION` constant (previously drifted at `0.2.0`) is realigned to the package version.
- **Version Bump**: Updated package version to `0.2.3`.

## [0.2.2]

### Added
- **MiniMax-M3 Model**: Added `MiniMax-M3` to both `minimax` and `minimax-cn` providers in the model registry.
  - `minimax` provider: base URL `https://api.minimax.io/anthropic`
  - `minimax-cn` provider: base URL `https://api.minimaxi.com/anthropic`
  - Context window: 1,048,576 tokens (1M ceiling, 512K guaranteed minimum)
  - Max output: 512,000 tokens
  - Multimodal input: `["text", "image"]` (native multimodal from step 0)
  - Pricing (standard ≤512K tier): input `$0.60` / output `$2.40` / cache read `$0.12` per 1M tokens
  - Pricing (long-context 512K–1M tier): input `$1.20` / output `$4.80` / cache read `$0.24` per 1M tokens
  - Reasoning: enabled
- **Local Framework Dependency**: Switched `indusagi` dependency from npm (`^0.13.0`) to local package (`file:../indus-rebuild`) for direct development iteration.

### Changed
- **Version Bump**: Updated package version to `0.2.2`.

## [0.1.62] - Latest Release

### Added
- **Rich Markdown Rendering**: Assistant replies now render as styled terminal output instead of raw markdown — themed headings, bold/italic, depth-aware ordered/unordered lists, blockquotes, inline code, and OSC-8 links — via a new `marked`-based markdown→ANSI pipeline (`react-ink/markdown/`) with an LRU token cache and a no-markdown fast-path.
- **Syntax-Highlighted Code**: Fenced code blocks and `read` / `write` / `edit` tool bodies are now syntax-highlighted (highlight.js, JS-only — no native dependency), with a plain-text fallback for unknown languages.
- **Markdown Tables**: GFM tables render as aligned flexbox columns (measured column widths, bold header, per-column alignment) instead of raw pipe strings.
- **Flicker-Free Streaming**: Streaming assistant output uses a stable-prefix boundary (`StreamingMarkdown`) — completed blocks are parsed once and frozen, and only the growing last block re-lexes per delta, eliminating the whole-answer reflow and the swap flicker.
- **Colored Diff Blocks**: `edit` / `write` tool results render as a colored diff — themed added/removed backgrounds, a right-aligned line-number gutter, three context lines, and multi-hunk separators (via the `diff` package's `structuredPatch`, pure Ink).
- **Word-Level Diff Highlighting**: Adjacent changed lines get intra-line word-level emphasis (`diffWordsWithSpace`), suppressed above a ~40% change threshold to avoid noise.
- **Two-Tone Banner Emblem**: The startup masthead gains an original two-tone block-glyph emblem beside the wordmark.
- **Personalized Welcome**: A "Welcome back{, name}!" line sourced from the signed-in account display name (falls back to "Welcome back!").
- **Auto Condensed Banner**: The full masthead shows on first launch / version bump; repeat launches of an already-seen version use the condensed one-line header (persisted `lastSeenVersion`, with an `INDUS_FORCE_FULL_LOGO` override).
- **Optional Color-Sweep Flourish**: A gated color sweep over the wordmark/emblem — off by default and suppressed under reduced-motion and non-TTY.
- **Color-Blind Themes**: Two daltonized schemes (`midnight-cb`, `daylight-cb`) where success is blue rather than green, so affirm vs alarm are distinguishable without relying on the red-green axis.
- **Live Theme Preview**: The theme picker now previews the whole console live as you move the highlight — **Enter** keeps it, **Esc** reverts to the scheme you opened with (previously every touch persisted irrevocably).

### Changed
- **Framework UI Components**: The `indusagi` framework (`react-ink`) gains the markdown, syntax-highlight, table, streaming, and diff components, plus 12 new theme roles (inline-code / heading / blockquote bar, diff added/removed backgrounds, and syntax-highlight scopes) that the console binds to its palette.
- **Framework Dependency**: Pinned to the published `indusagi@^0.12.34` (the version that ships the new react-ink markdown/diff components), resolved from the registry rather than the local sibling.
- **Startup Banner**: The full `INDUS CODE` masthead now shows on every launch, and the changelog block is no longer surfaced at startup (use `/changelog` on demand).
- **Single-Source Version**: `--version` and the banner now read one `VERSION` constant (co-located with the brand), so they can no longer drift.
- **Version Bump**: Updated package version to `0.1.62`.

### Fixed
- **Accurate Context Usage**: The footer's `ctx:%` now reflects the latest turn's context occupancy instead of the cumulative session token total — it no longer inflates (e.g. 84.9% on a near-empty context).
- **Streaming Narration**: Fixed the live streaming preview that concatenated every narration segment and clipped each one's first word; each segment now streams cleanly on its own.

## [0.1.61] - Latest Release

### Fixed
- **CLI silent no-op when installed globally**: `indus` / `indusagi` (including `--version` / `-v`) produced no output when run through a global `npm install -g` symlink — the entry-point check compared raw paths, which never matched the linked bin, so the program never started. The check now resolves both sides through realpath.

## [0.1.60] - Latest Release

### Changed
- **Published Framework Dependency**: Pinned the `indusagi` dependency to the published npm package `indusagi@^0.12.33` (replaces the local sibling path `file:../indus-rebuild`). Installs now resolve from the registry.
- **Bin Shims**: Normalized the `indus` / `indusagi` bin paths so both commands install correctly from the published tarball.
- **Version Bump**: Updated package version to `0.1.60`.

## [0.1.58] - Latest Release

### Changed
- **Published Framework Dependency**: Pinned the `indusagi` dependency to the published npm package `indusagi@^0.12.31` (replaces the local sibling path `file:../indusvx-screth_copy`). Installs now resolve from the registry instead of the local working tree.
- **Version Bump**: Updated package version to `0.1.58`.

## [0.1.57]

### Changed
- **Version Bump**: Updated package version to `0.1.57`.

## [0.1.56]

### Added
- **GPT-5.5 Model (CLI bridges)**: Added `gpt-5.5` to the built-in CLI-bridge providers in `app/runtime/providers/builtins.ts`:
  - `codex-cli` / `gpt-5.5` — `contextWindow: 1_000_000`, `maxTokens: 128_000`.
  - `indusagi-cli` / `openai/gpt-5.5` — `api: openai-responses`, `contextWindow: 1_000_000`, `maxTokens: 128_000`.
  - `indusagi-cli` / `openai-codex/gpt-5.5` — `api: openai-codex-responses`, `contextWindow: 1_000_000`, `maxTokens: 128_000`.
- **Framework Bump**: Aligned with `indusagi@0.12.31`, which adds the direct `openai` / `gpt-5.5` and `openai-codex` / `gpt-5.5` model entries (1M context, 128K max output, `$5` / `$30` per 1M, `cacheRead: $0.5`).

### Changed
- **Published Framework Dependency**: Pinned the `indusagi` dependency to the published npm package `indusagi@^0.12.31` (the version that ships the `openai` / `gpt-5.5` and `openai-codex` / `gpt-5.5` model entries).
- **Postinstall Patcher Compatibility**: Updated `tasks/patch-indusagi-react-host.mjs` so it recognises the freshly-built `loader.js` (which uses `argv1Real` instead of the older `__argv1Real` variable name) as already-patched, instead of throwing on install.
- **Version Bump**: Updated package version to `0.1.56`.

## [0.1.55] - Latest Release

### Changed
- **Version Bump**: Updated package version to `0.1.55`.

### Notes
- Package name remains **`indusagi-coding-agent`** (unchanged).
- Bin shims unchanged — `indus` and `indusagi` both resolve to `dist/cli.js`.
- Install with `npm install -g indusagi-coding-agent` once published.

## [0.1.54] - Latest Release

### Changed
- **Published Framework Dependency**: Switched the `indusagi` dependency from the local sibling path (`file:../indusvx-screth_copy`) back to the published npm package `indusagi@^0.12.30`. The previous symlink-based workflow has been replaced with a clean registry install resolved against `https://registry.npmjs.org/indusagi/-/indusagi-0.12.30.tgz`.
- **Krutrim Default Model**: Switched the Krutrim provider's default model from `Krutrim-2` to `gpt-oss-20b`, matching the canonical Krutrim cURL example. Updated both `app/runtime/model-resolver.ts` and the compiled `dist/runtime/model-resolver.js`.
- **Framework Bump**: Aligned with `indusagi@0.12.30`, which adds three Krutrim models — `gpt-oss-20b`, `gpt-oss-120b` (128K context / 8K output), and `gemma-4-31b-it` (Gemma-3-class limits, unverified id — confirm against Krutrim's Model Card) — and fixes the React-Host loader two-React bug that produced the `_jsx is not a function` / "Objects are not valid as a React child" error in `<MessageList>`.
- **Version Bump**: Updated package version to `0.1.54`.

## [0.1.53] - Latest Release

### Changed
- **License Switch**: Replaced the MIT `LICENSE` with a proprietary "all rights reserved" notice for IndusAGI Labs.
- **Third-Party Notice**: Added a third-party license notice covering bundled dependencies.
- **README Credits**: Added a Credits section attributing IndusAGI to Varun Israni / IndusAGI Labs.
- **Version Bump**: Updated package version to `0.1.53`.

## [0.1.52] - Latest Release

### Added
- **Prompt Paste Collapsing**: Large pastes in the React Ink prompt now collapse into a single `[paste #N +M lines]` / `[paste #N K chars]` placeholder instead of flooding the editor. On submit, the placeholder is expanded back to its full content before the message is sent to the model.
- **Chunked Paste Coalescing**: Rapid stdin chunks from a single paste are merged into one growing placeholder via an 80 ms debounce, so a 100+ / 200+ line paste produces one marker rather than many fragmented ones.

### Changed
- **Version Bump**: Updated package version to `0.1.52`.

## [0.1.49] - Latest Release

### Changed
- **Published Framework Dependency**: Standardized `indusagi-screth` on the published npm package `indusagi@0.12.26` instead of the local sibling package workflow.
- **Version Bump**: Updated package version to `0.1.49`.

### Fixed
- **React Ink Footer Safety**: Hardened footer rendering so the runtime no longer passes invalid React children through the footer text path.
- **User Message Surface**: Updated user messages to use the gray message surface with explicit white text for clearer contrast in the React Ink UI.
- **Streaming Reply Path**: Removed the temporary live-stream rendering path so replies render from committed session messages only.

## [0.1.51] - Latest Release

### Changed
- **Local Footer Override**: `indusagi-screth` now ships its own React Ink footer component instead of depending on the shared footer renderer from the framework package.
- **Version Bump**: Updated package version to `0.1.51`.

### Fixed
- **Global CLI Footer Crash**: Removed the React child rendering path that could crash the `indus` footer with `Objects are not valid as a React child`.

## [0.1.47] - Latest Release

### Changed
- **React Ink UI Revamp**: Fully refreshed the interactive UI around the React Ink experience, including prompt behavior, session pickers, slash-command flows, status/footer cleanup, and tool activity presentation.
- **Single Interactive UI**: Removed the legacy terminal UI implementation so React Ink is now the only interactive interface in `indusagi-screth`.
- **Published Framework Package**: Switched the framework dependency to the published npm package `indusagi@0.12.24`.
- **Version Bump**: Updated package version to `0.1.47`.

### Fixed
- **Published Package Compatibility**: Added local compatibility handling so `indusagi-screth` continues to build cleanly against the published `indusagi@0.12.24` package.
- **Theme Asset Layout**: Moved shared theme assets out of the removed legacy UI path and updated runtime/build lookups accordingly.

## [0.1.44] - Latest Release

### Changed
- **Footer Rendering Safety**: Hardened footer line layout for narrow terminals using visual-width aware truncation to prevent overflow-prone output.
- **Working Directory Display**: Switched footer path truncation to `visibleWidth`/`truncateToWidth` behavior for safer ANSI-aware clipping.
- **Version Bump**: Updated package version to `0.1.44`.

### Fixed
- **TUI Width Overflow Risk**: Prevented footer stats/status combinations from exceeding terminal width in small viewports.

## [0.1.43] - Latest Release

### Changed
- **Published Dependency Source**: Switched the `indusagi` dependency from the local sibling package to the published npm package `indusagi@0.12.23`.
- **Build Workflow**: Removed the local sibling package build requirement from `build:observe-local` so the coding agent builds against the published package.
- **Version Bump**: Updated package version to `0.1.43`.

### Fixed
- **Observe Compatibility**: Vendored the observe runtime into `indusagi-screth` so observe imports and builds continue to work with the published `indusagi@0.12.23` package.
- **Observe Smoke Loader**: Updated the smoke validation script to load the coding agent's own built `dist/observe.js` instead of the old sibling package path.

## [0.1.42]

### Changed
- **Config Compatibility**: Restored the legacy `.indusagi` config directory so existing user settings, models, auth, and sessions continue to work.
- **Local Dependency Source**: Switched the `indusagi` dependency to the local sibling package `file:../indusvx-screth_copy` for workspace development.
- **Version Bump**: Updated package version to `0.1.42`.

### Fixed
- **Import Paths**: Updated coding-agent imports and runtime asset lookups for the current package layout.
- **Build Output Paths**: Standardized CLI/runtime references to `dist/`.

## [0.1.41]

### Changed
- **README Naming**: Replaced `induscode` references with `@varun1213213123132/indus1-test` in `README.md`.
- **Version Bump**: Updated package version to `0.1.41`.

## [0.1.40]

### Fixed
- **UUID Runtime Error**: Added missing `uuid` dependency to fix `ERR_MODULE_NOT_FOUND` at runtime (`dist/observability/core/span.js`).

### Changed
- **CLI Commands**: Added `indus` and `indusagi` command mappings to `dist/cli.js`.
- **Version Bump**: Updated package version to `0.1.40`.

## [0.1.39]

### Changed
- **Package Rename**: Updated package name from `induscode` to `@varun1213213123132/indus1-test`.
- **Version Bump**: Updated package version to `0.1.39`.

## [0.1.38]

### Added
- **MiniMax New Defaults**: Added support defaults for new MiniMax generations
  - `minimax` now defaults to `MiniMax-M2.7`
  - `minimax-cn` now defaults to `MiniMax-M2.5`

### Changed
- **Model Resolver**: Updated MiniMax default model mapping in `defaultModelPerProvider`

## [0.1.37]

### Changed
- **Indusagi Dependency**: Updated `indusagi` to `^0.12.17`
- **Version Bump**: Updated `induscode` package version to `0.1.37`

## [0.1.36]

### Added
- **GPT-5.4 Mini Support**: Added support for `gpt-5.4-mini` via updated `indusagi` dependency

### Changed
- **Indusagi Dependency**: Updated `indusagi` to `^0.12.16`
- **Version Bump**: Updated `induscode` package version to `0.1.36`

## [0.1.35]

### Added
- Introduced `induscode` as the upgraded/newer package direction while keeping `induscode` available

### Changed
- Kept package name as `induscode`
- Updated package version to `0.1.4`
- Added `induscode` as a supported CLI command alongside `indus`
- Updated `indusagi` dependency to `^0.12.17`

## [0.1.34]

### Changed
- Updated `indusagi` dependency to `^0.12.17`
- Synced changelog with latest `indusagi` package release

## [0.1.33]

### Changed
- Updated `indusagi` dependency to `^0.12.16`
- Version bump to sync with npm package release

## [0.1.32] - MCP Async Loading & Startup Optimization

### Added
- **Async MCP Loading**: MCP servers now load in background, no longer blocking CLI startup
  - Instant CLI initialization (~200-500ms vs 5-10 seconds)
  - MCP tools become available within 1-2 seconds
  - Tools automatically registered when ready
- **Enhanced stdin Timeout**: Robust piped input handling
  - 5-second timeout prevents indefinite hanging
  - Proper error handling for stream errors
  - Clean event listener cleanup prevents memory leaks

### Changed
- **MCP Initialization**: Converted from blocking `await` to non-blocking `.then()/.catch()`
  - Session creation no longer waits for MCP servers
  - Better user experience with instant prompt availability
  - Background loading of tools doesn't interfere with CLI startup
- **stdin Reading**: Improved `readPipedStdin()` with timeout mechanism
  - Handles edge cases where stream 'end' event doesn't fire
  - Graceful fallback after 5 seconds
  - Better resource cleanup

### Performance
- **Startup Time**: 95%+ faster with piped input
  - Before: 5-10 seconds
  - After: ~200-500ms (instant)
- **Interactive Mode**: No regression in responsiveness
- **Resource Usage**: Reduced memory footprint through proper cleanup

## [0.1.31] - GPT-5.4, Memory & MCP Integration

### Added
- **GPT-5.4 Model Family**: Full support for GPT-5.4 models
  - `gpt-5.4` - Base model with improved performance
  - `gpt-5.4-codex` - Specialized for coding tasks (now default for openai-codex)
  - All variants available across all AI providers
- **GPT-5.3 Models**: Added GPT-5.3 variants alongside GPT-5.4
  - `gpt-5.3`, `gpt-5.3-codex`
  - Consistent pricing and performance characteristics
- **Memory Support**: Integrated memory context injection
  - Semantic search through conversation history
  - Vector embeddings for better context retrieval
  - Configurable in-memory storage
- **Clean CLI Output**: Improved terminal experience
  - MCP debug messages suppressed by default
  - Cleaner startup sequence
  - Can be enabled with `INDUSAGI_DEBUG=1` environment variable

### Changed
- **Default Model**: OpenAI Codex provider now defaults to `gpt-5.4-codex`
- **Indusagi Dependency**: Updated to `^0.12.15` (npm package) with GPT-5.4 & Memory support
  - Changed from local file reference (`file:../new_indusagi_mcp`) to npm package
- **Model Resolver**: Updated to include new GPT-5.3 and GPT-5.4 models

## [0.1.30] - Kimi K2.5 Reasoning & GLM-5 Fix

### Added
- **Kimi K2.5 Reasoning**: All Kimi K2.5 models now have thinking/reasoning enabled
  - `kimi-k2.5`: `reasoning: true`
  - `kimi-for-coding`: `reasoning: true`
  - `k2p5` (legacy alias): `reasoning: true`

### Fixed
- **GLM-5 Context Overflow**: Fixed compaction error when using GLM-5 model
  - Context window and max tokens adjusted to prevent overflow errors
  - Session compaction now works correctly with GLM-5

### Changed
- Updated `indusagi` dependency to `^0.12.13` (npm package)

## [0.1.29] - Update Docs & Dependency

### Changed
- **Indusagi Dependency**: Updated to `^0.12.12` (published npm package)
- **Docs Link**: Added https://www.indusagi.com to README
- **Session Management**: SessionManager + message helpers now re-exported from `indusagi/agent`

## [0.1.28] - Use Published Indusagi Package

### Changed
- **Indusagi Dependency**: Changed from local file path to published npm package
  - Was: `"indusagi": "file:../new_indusagi"`
  - Now: `"indusagi": "^0.12.11"`
  - Uses published package with all latest fixes

---

## [0.1.27] - Task & Todo Tools from Indusagi

### Changed
- **Task Tool**: Now uses indusagi's task tool with custom TaskExecutor
  - Injects TaskSessionManager for real subagent execution
  - Shows real-time tool count and duration during execution
  - Proper streaming updates via onUpdate callback

- **Todo Tool**: Now uses indusagi's TodoStore with session persistence
  - Uses TodoStoreOptions for persist/load/rebuildFromBranch callbacks
  - Integrates with SessionManager for todo persistence
  - Deleted local `src/core/todo-store.ts`

- **Updated indusagi to 0.12.11**: Includes task tool streaming fixes

### Files Modified
- `src/core/tools/task.ts` - Uses indusagi tool + TaskExecutor
- `src/core/tools/todo.ts` - Uses indusagi TodoStore with callbacks
- `src/core/tools/index.ts` - Updated exports
- `src/core/agent-session.ts` - Uses createSessionTodoStore
- `src/index.ts` - Fixed TodoStore import

### Files Deleted
- `src/core/todo-store.ts` - Now using indusagi's TodoStore

---

## [0.1.26] - Refactor: Use indusagi Package Tools

### Changed
- **Major Refactoring**: Replaced internal tool implementations with `indusagi` package exports
  - Removed ~4,800 lines of duplicate code from `src/core/tools/`
  - Tools now imported from `indusagi/agent` instead of local implementations
  - Updated `indusagi` dependency to `^0.12.9`

### Tools Now from indusagi Package
- `read` - Read file contents (text + images)
- `write` - Create/overwrite files
- `edit` - Surgical text replacements
- `bash` - Execute shell commands
- `grep` - Pattern search in files
- `find` - Find files by name/pattern
- `ls` - List directory contents
- `webfetch` - Fetch URL content
- `websearch` - **Now uses DuckDuckGo API** (previously Exa AI placeholder)

### Local Tools Kept (Custom Integrations)
- `task` - Has dependencies on local ModelRegistry, SubagentStore, SettingsManager
- `todo` - Uses local TodoStore with SessionManager integration
- `bg-process` - Not available in indusagi

### Files Deleted
- `src/core/tools/read.ts` (538 lines)
- `src/core/tools/write.ts` (377 lines)
- `src/core/tools/edit.ts` (519 lines)
- `src/core/tools/bash.ts` (701 lines)
- `src/core/tools/grep.ts` (639 lines)
- `src/core/tools/find.ts` (454 lines)
- `src/core/tools/ls.ts` (176 lines)
- `src/core/tools/webfetch.ts` (491 lines)
- `src/core/tools/websearch.ts` (358 lines)
- `src/core/tools/truncate.ts` (265 lines)
- `src/core/tools/edit-diff.ts` (308 lines)
- `src/core/tools/path-utils.ts` (60 lines)

### Files Modified
- `src/core/tools/index.ts` - Re-exports from indusagi + local tools
- `src/core/settings-manager.ts` - Updated imports
- `src/core/task-session-manager.ts` - Updated imports
- `src/core/bash-executor.ts` - Updated imports
- `src/core/extensions/types.ts` - Updated imports
- `src/core/agent-session.ts` - Updated imports
- `src/modes/interactive/interactive-mode.ts` - Updated imports
- `src/modes/interactive/components/bash-execution.ts` - Updated imports
- `src/modes/interactive/components/tool-execution.ts` - Updated imports
- `src/cli/file-processor.ts` - Updated imports
- `src/index.ts` - Removed `FindOperations` export (not in indusagi)

### Benefits
- ✅ Single source of truth for tool implementations
- ✅ Bug fixes in indusagi automatically benefit this project
- ✅ ~4,800 lines of code removed
- ✅ DuckDuckGo web search works out of the box
- ✅ Easier maintenance

---

## [0.1.25] - Web Search & Fetch Tools

### Added
- **websearch** - Real-time web search via Exa AI API
  - Search types: auto, fast, deep
  - Configurable result count (1-10)
  - LLM-optimized output

- **webfetch** - URL content retrieval and transformation
  - Multiple formats: text, markdown, HTML
  - Image support with base64 encoding
  - Timeout and size limits (5MB max)

- **Web tools now default** - Automatically available in all agent sessions

### Changed
- `codingTools`: 7 → 9 tools (added websearch, webfetch)
- `allTools`: 10 → 12 tools (added websearch, webfetch)
- `defaultActiveToolNames` updated in SDK for automatic activation
- Updated package.json description

### Files Modified
- `src/core/tools/index.ts` - Added exports and updated tool arrays
- `src/core/tools/registry.ts` - Registered web tools as core
- `src/core/sdk.ts` - Added web tools to defaultActiveToolNames (CRITICAL)
- `package.json` - Version bump + description update

### Security
- ✅ URL validation (http/https only)
- ✅ Response size limiting (5MB)
- ✅ Timeout enforcement (max 120s)
- ✅ API key required for websearch
- ✅ No breaking changes, fully backward compatible

---

## [0.1.24] - CLI Module Rebranding

### Added
- **CLI Module Documentation**: Comprehensive documentation added to all CLI files
  - File headers with purpose documentation and vendor attribution
  - Section comments for logical code blocks
  - JSDoc for all public interfaces and types
  - Inline comments for complex decision points

### Changed
- **CLI Argument Parser (args.ts)**:
  - Added constants for default values (VALID_THINKING_LEVELS, DEFAULT_TOOLS, AVAILABLE_TOOLS)
  - Created type guards (isValidThinkingLevel, isValidMode, isValidToolName)
  - Added validation functions (validateToolNames, validateThinkingLevel)
  - Organized imports with clear separation
  - Enhanced Args interface with comprehensive JSDoc

- **Configuration Selector (config-selector.ts)**:
  - Added ConfigSelectorOptions interface with full documentation
  - Documented TUI setup and cleanup workflow
  - Enhanced callback documentation (onResolve, onExit, onRequestRender)

- **File Processor (file-processor.ts)**:
  - Added file validation (isSupportedTextFile, isSupportedImageMimeType)
  - Added file size limits (MAX_TEXT_FILE_SIZE: 10MB, MAX_IMAGE_FILE_SIZE: 20MB)
  - Created FileProcessError custom error class with helpful suggestions
  - Added validateFileSize function with limit checking

- **Login Handler (login-handler.ts)**:
  - Added SECURITY CONSIDERATIONS section documenting credential storage safety
  - Created LoginError and CredentialValidationError custom error classes
  - Added validation functions (validateApiKey, validateAccountName, isValidProvider)
  - Enhanced multi-account support documentation
  - Improved error messages for auth failures

- **Model List (list-models.ts)**:
  - Added ModelFilterOptions interface for flexible model filtering
  - Added ModelRow interface for formatted table output
  - Added utility functions (filterModels, sortModels, calculateColumnWidths)
  - Enhanced model display with proper column widths
  - Added model capability indicators (thinking, images)

- **Session Picker (session-picker.ts)**:
  - Created SessionPickerError custom error class
  - Added session utility functions (calculateSessionStats, formatAge, formatSize)
  - Added session metadata display capabilities
  - Enhanced session sorting and filtering options

### Fixed
- **Error Handling**: Consistent error message format across all CLI files
- **Type Safety**: Type guards for runtime type checking and validation
- **Security**: API key format validation prevents placeholder values
- **File Access**: Improved error messages with actionable suggestions

### Tests
- **CLI Argument Tests**: 40+ test cases for argument parsing
- **File Processor Tests**: 20+ test cases for file processing
- **Login Handler Tests**: 25+ test cases for authentication flow

### Documentation
- **CLI-REFACTORING-SUMMARY.md**: Complete summary of all changes
  - 6 files updated with ~2000 lines of documentation
  - 85+ test cases covering all major functionality
  - All high and medium priority tasks complete

## [0.1.23]

### Changed
- Bumped version to 0.1.23

## [0.1.22]

### Changed
- Updated `indusagi` dependency to use published npm package `^0.12.8` (was `file:../indusagi-copy`)

## [0.1.21]

### Added
- **Multi-account support**: Login with multiple accounts per provider
  - Use `indusagi login --provider <provider> --account <name>` to add named accounts
  - Use `indusagi login --list` to view all saved accounts
  - Use `indusagi --account <name>` to select which account to use
  - Interactive mode: Select existing accounts or add new ones via `/login`
- **Claude Sonnet 4.6**: New model added (`claude-sonnet-4-6`) with 200K context, 128K max output, $3/$15 pricing
- **GLM-5 model**: Fixed endpoint for Z.AI coding subscription (`api.z.ai/api/coding/paas/v4`)

### Changed
- **GPT-5.3 Codex Spark**: Context window updated from 32K to 128K tokens
- Updated `indusagi` dependency to `0.12.6`

### Removed
- **Google Cloud Code Assist (Gemini CLI)**: OAuth provider removed
- **Google Antigravity**: OAuth provider and all models removed

## [0.1.20]

### Fixed
- **kimi-coding**: updated to `indusagi` 0.12.5 with correct official Kimi Code API config
- Default model changed from `k2p5` → `kimi-for-coding` (official model ID)

### Changed
- Updated `indusagi` dependency to `0.12.5`

## [0.1.19]

### Fixed
- **kimi-coding garbled responses**: updated to `indusagi` 0.12.4 with correct `openai-completions` API + `api.moonshot.cn/v1` baseUrl

### Changed
- Updated `indusagi` dependency to `0.12.4`

## [0.1.18]

### Fixed
- **kimi-coding empty responses**: updated to `indusagi` 0.12.3 which uses `anthropic-messages` API for Kimi Code

### Changed
- Updated `indusagi` dependency to `0.12.3`

## [0.1.17]

### Fixed
- **Kimi fetch failed**: updated to `indusagi` 0.12.2 which fixes Kimi API calls
- Default Kimi model updated to `kimi-k2.5`, Kimi Code to `k2p5`
- Correct env vars: `MOONSHOT_API_KEY` for kimi, `KIMI_API_KEY` for kimi-coding

### Changed
- Updated `indusagi` dependency to `0.12.2`

## [0.1.16]

### Fixed
- **Kimi login**: Removed Kimi from OAuth provider registry — no more `fetch failed` error
- **TUI /login**: Kimi now appears in the API key section with correct env var hints (`MOONSHOT_API_KEY` / `KIMI_API_KEY`)

### Changed
- Updated `indusagi` dependency to v0.12.1

## [0.1.15]

### Added
- **New `login` command**: Authenticate with AI providers using OAuth or API keys
  - `indusagi login` - Show list of available providers
  - `indusagi login --provider <name>` - Login to a specific provider
  - `indusagi login --provider <name> --method oauth|api-key` - Choose auth method
  - Supports Kimi, Anthropic, OpenAI, Google, and more
- **Kimi (Moonshot AI) Support**: Full integration with Kimi K2.5 and Kimi Code API
  - 5 new Kimi models available
  - OAuth and API key authentication via `/login` command
  - Environment variables: `KIMI_API_KEY`, `KIMICODE_API_KEY`

### Changed
- Updated `indusagi` dependency to v0.12.0 (now includes Kimi provider support)
- Updated help text with new login command examples and Kimi environment variables

## [0.1.14]

### Fixed
- **Google Antigravity**: Fixed `User-Agent` header (removed old version number)
- **Google Antigravity**: Fixed `ideType` to `ANTIGRAVITY` in Client-Metadata headers
- **Google Antigravity**: All 6 models now work: `gemini-3-flash`, `gemini-3-pro-high`, `gemini-3-pro-low`, `gpt-oss-120b-medium`, `claude-sonnet-4-5`, `claude-opus-4-6-thinking`
- **Google Antigravity**: Set the assistant identity to "indusagi"

### Changed
- Updated `indusagi` dependency to v0.11.9

## [0.1.13]

### Changed
- Updated `indusagi` dependency to v0.11.6
- Updated Google Antigravity OAuth to latest working implementation from openclaw

## [0.1.12] - 2026-02-17

### Added

- Officially added Skills support in `induscode` with project/global skill discovery and `/skill:name` workflow integration in the interactive CLI.

## [0.1.11] - 2026-02-16

### Added

- Added hooks export entry point (`induscode/hooks`) for extension integrations.
- Added parallel execution for multiple task tool calls (subagents) issued in the same response.

## [0.1.10] - 2026-02-14

### Added

- Added `/clear` as an alias for `/new` in interactive mode.
- Added the `gpt-5.3-codex-spark` model to the bundled model list.

### Changed

- Bumped the bundled indusagi dependency to `^0.11.4`.

## [0.1.9] - 2026-02-14

### Added

- Added the task subagent tool for delegating work to specialized subagents.
- Added todo read/write tools for tracking task lists.

### Changed

- Stream subagent task progress with tool input and output previews.

## [0.1.8] - 2026-02-14

### Added

- Added updated startup header UI with orange ASCII logo branding.
- Added optional `terminal.startupImage` setting for interactive startup images.
- Added Escape-to-clear behavior when idle in interactive mode.
- Added `glm-5` defaults for ZAI and Cerebras providers.

### Changed

- Simplified startup header output (shorter header text).

## [0.1.6] - 2026-02-12

### New Features

- indusagi packages for bundling and installing extensions, skills, prompts, and themes. See [docs/packages.md](docs/packages.md).
- Hot reload (`/reload`) of resources including AGENTS.md, SYSTEM.md, APPEND_SYSTEM.md, prompt templates, skills, themes, and extensions. See [README.md#commands](README.md#commands) and [README.md#context-files](README.md#context-files).
- Custom providers via `indusagi.registerProvider()` for proxies, custom endpoints, OAuth or SSO flows, and non-standard streaming APIs. See [docs/custom-provider.md](docs/custom-provider.md).
- Azure OpenAI Responses provider support with deployment-aware model mapping. See [docs/providers.md#azure-openai](docs/providers.md#azure-openai).
- OpenRouter routing support for custom models via `openRouterRouting`. See [docs/providers.md#api-keys](docs/providers.md#api-keys) and [docs/models.md](docs/models.md).
- Skill invocation messages are now collapsible and skills can opt out of model invocation via `disable-model-invocation`. See [docs/skills.md#frontmatter](docs/skills.md#frontmatter).
- Session selector renaming and configurable keybindings. See [README.md#commands](README.md#commands) and [docs/keybindings.md](docs/keybindings.md).
- `models.json` headers can resolve environment variables and shell commands. See [docs/models.md#value-resolution](docs/models.md#value-resolution).
- `--verbose` CLI flag to override quiet startup. See [README.md#cli-reference](README.md#cli-reference).

Read the fully revamped docs in `README.md`, or have your clanker read them for you.

### SDK Migration Guide

There are multiple SDK breaking changes since v0.49.3. For the quickest migration, point your agent at `packages/coding-agent/docs/sdk.md`, the SDK examples in `packages/coding-agent/examples/sdk`, and the SDK source in `packages/coding-agent/src/core/sdk.ts` and related modules.

### Breaking Changes

- Header values in `models.json` now resolve environment variables (if a header value matches an env var name, the env var value is used). This may change behavior if a literal header value accidentally matches an env var name.
- External packages (npm/git) are now configured via `packages` array in settings.json instead of `extensions`. Existing npm:/git: entries in `extensions` are auto-migrated.
- Resource loading now uses `ResourceLoader` only and settings.json uses arrays for extensions, skills, prompts, and themes
- Removed `discoverAuthStorage` and `discoverModels` from the SDK. `AuthStorage` and `ModelRegistry` now default to `~/.indusagi/agent` paths unless you pass an `agentDir`

### Added

- Session renaming in `/resume` picker via `Ctrl+R` without opening the session
- Session selector keybindings are now configurable
- `disable-model-invocation` frontmatter field for skills to prevent agentic invocation while still allowing explicit `/skill:name` commands
- Exposed `copyToClipboard` utility for extensions
- Skill invocation messages are now collapsible in chat output, showing collapsed by default with skill name and expand hint
- Header values in `models.json` now support environment variables and shell commands, matching `apiKey` resolution
- Added HTTP proxy environment variable support for API requests
- Added OpenRouter provider routing support for custom models via `openRouterRouting` compat field
- Added `azure-openai-responses` provider support for Azure OpenAI Responses API.
- Added changelog link to update notifications
- Added `--verbose` CLI flag to override quietStartup setting
- `markdown.codeBlockIndent` setting to customize code block indentation in rendered output
- Extension package management with `indusagi install`, `indusagi remove`, `indusagi update`, and `indusagi list` commands
- Package filtering: selectively load resources from packages using object form in `packages` array
- Glob pattern support with minimatch in package filters, top-level settings arrays, and indusagi manifest (e.g., `"!funky.json"`, `"*.ts"`)
- `/reload` command to reload extensions, skills, prompts, and themes
- `indusagi config` command with TUI to enable/disable package and top-level resources via patterns
- CLI flags for `--skill`, `--prompt-template`, `--theme`, `--no-prompt-templates`, and `--no-themes`
- Package deduplication: if same package appears in global and project settings, project wins
- Unified collision reporting with `ResourceDiagnostic` type for all resource types
- Show provider alongside the model in the footer if multiple providers are available
- Custom provider support via `indusagi.registerProvider()` with `streamSimple` for custom API implementations
- Added `custom-provider.ts` example extension demonstrating custom Anthropic provider with OAuth

### Changed

- `/resume` picker sort toggle moved to `Ctrl+S` to free `Ctrl+R` for rename
- HTML export: clicking a sidebar message now navigates to its newest leaf and scrolls to it, instead of truncating the branch
- HTML export: active path is now visually highlighted with dimmed off-path nodes
- Azure OpenAI Responses provider now uses base URL configuration with deployment-aware model mapping and no longer includes service tier handling
- `/reload` now re-renders the entire scrollback so updated extension components are visible immediately
- Skill, prompt template, and theme discovery now use settings and CLI path arrays instead of legacy filters

### Fixed

- Extension `setWorkingMessage()` calls in `agent_start` handlers now work correctly; previously the message was silently ignored because the loading animation didn't exist yet
- Fixed package auto-discovery to respect loader rules, config overrides, and force-exclude patterns
- Fixed /reload restoring the correct editor after reload
- Fixed distributed themes breaking `/export`
- Fixed startup hints to clarify thinking level selection and expanded thinking guidance
- Fixed SDK initial model resolution to use `findInitialModel` and default to Claude Opus 4.5 for Anthropic models
- Fixed no-models warning to include the `/model` instruction
- Fixed authentication error messages to point to the authentication documentation
- Fixed bash output hint lines to truncate to terminal width
- Fixed custom editors to honor the `paddingX` setting
- Fixed system prompt tool list to show only built-in tools
- Fixed package manager to check npm package versions before using cached copies
- Fixed package manager to run `npm install` after cloning git repositories with a package.json
- Fixed extension provider registrations to apply before model resolution
- Fixed editor multi-line insertion handling and lastAction tracking
- Fixed editor word wrapping to reserve a cursor column
- Fixed editor word wrapping to use single-pass backtracking for whitespace handling
- Fixed Kitty image ID allocation and cleanup to prevent image ID collisions
- Fixed overlays staying centered after terminal resizes
- Fixed streaming dispatch to use the model api type instead of hardcoded API defaults
- Fixed Google providers to default tool call arguments to an empty object when omitted
- Fixed OpenAI Responses streaming to handle `arguments.done` events on OpenAI-compatible endpoints
- Fixed OpenAI Codex Responses tool strictness handling after the shared responses refactor
- Fixed Azure OpenAI Responses streaming to guard deltas before content parts and correct metadata and handoff gating
- Fixed OpenAI completions tool-result image batching after consecutive tool results
- Off-by-one error in bash output "earlier lines" count caused by counting spacing newline as hidden content
- User package filters now layer on top of manifest filters instead of replacing them
- Auto-retry now handles "terminated" errors from Codex API mid-stream failures
- Follow-up queue (Alt+Enter) now sends full paste content instead of `[paste #N ...]` markers
- Fixed Alt-Up not restoring messages queued during compaction
- Fixed session corruption when loading empty or invalid session files via `--session` flag
- Fixed extension shortcuts not firing when extension also uses `setEditorComponent()`
- Session "modified" time now uses last message timestamp instead of file mtime, so renaming doesn't reorder the recent list

## [0.1.13]

### Changed
- Updated \`indusagi\` dependency to v0.11.6
- Updated Google Antigravity OAuth to latest working implementation from openclaw
- **Google Gemini 3 models**: Fixed deprecated model IDs (via indusagi@0.11.6)
  - Added \`normalizeGoogleModelId()\` to map \`gemini-3-pro-high\` → \`gemini-3-pro-preview\`
  - Map \`gemini-3-pro-low\` → \`gemini-3-pro-preview\`
  - Map \`gemini-3-flash\` → \`gemini-3-flash-preview\`
  - Updated \`getGeminiCliThinkingLevel()\` to use normalized model IDs
  - Updated \`buildRequest()\` to use normalized model IDs in API calls
  - Fixed "version of Antigravity is no longer supported" error from Google API
