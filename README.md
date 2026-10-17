# indusagi coding agent

A terminal-first AI coding agent. Talk to it in your terminal, point it at a
repo, and it reads, writes, runs, and reasons about your code. It runs entirely
on the [`indusagi`](../indus-rebuild) framework — one dependency for the LLM API,
agent loop, terminal UI, MCP client, and tracing.

It is **built from scratch**: every module was written from a behavioral spec and the
framework's public API, never by copying third-party application source. See
[`CREDITS.md`](./CREDITS.md) and [`NOTICE`](./NOTICE).

```
indus                      # start an interactive session in the current repo
indus "fix the failing test in src/auth"
indus -p "summarise what changed on this branch"   # headless, prints result, exits
indus --json               # line protocol for a driving parent process
```

(The bin is installed as both `indus` and `indusagi`.)

## Install & build

```bash
npm install
npm run build          # esbuild bundle -> dist/entry.js  +  tsc d.ts -> dist/types
npm test               # vitest
npm run typecheck      # tsc --noEmit
npm run lineage-scan   # fails if any external-source marker appears in non-test source
```

Requires **Node >= 20**. Authenticate with an API key — set `ANTHROPIC_API_KEY`
(or another supported provider key) in the environment, or run `indus signin`.
**API-key auth only; there is no OAuth path.**

## Run modes

| Invocation | Mode | What it does |
|------------|------|--------------|
| `indus` | interactive | Ink/React REPL — streaming replies, a live tool deck, slash-commands |
| `indus -p "…"` / `--print` | print | One request, prints the final result, exits |
| `indus --json` / `--rpc` | line protocol | Newline-delimited JSON for a parent process to drive |
| `indus signin` / `signout` | credentials | Store / clear the API key in the local auth vault |

`indus --help` prints the full flag grammar (generated from one flag table);
`indus --version` prints the version.

## Project trust and private state

- Executable files under `<repo>/.indus/addons` are disabled by default. Review
  them, then pass `--trust-project-addons` to approve the canonical workspace and
  the current addon-tree SHA-256 digest. The owner-only trust record is reused
  while that digest is unchanged; any addon edit invalidates it.
- Context files are discovered only inside the canonical `--cwd` workspace.
  Imports that resolve outside it are ignored unless the exact file is listed by
  `--allow-context-import <path>`. Symlinks and likely secret files such as
  `.env`, private-key files, and credential files are never auto-imported.
- On POSIX, agent state/session directories are enforced as `0700` and
  credentials, trust records, integration keys, and transcripts as `0600`.
  Existing owned paths are tightened; symlink destinations and paths owned by a
  different user are rejected. Sensitive replacements use same-directory atomic
  writes. Sarvam API keys are no longer read from or written to project config.
- Windows does not implement POSIX mode bits. The same symlink/regular-file and
  atomic-replacement checks apply, but this release does not install Windows
  ACLs; use a private user profile with appropriately restricted ACLs.

## Architecture

The binary is `src/entry.ts`. Boot resolves the invocation, prepares the
workspace, and selects a runner. Each subsystem is a self-contained module and is
also exported as a namespace from `src/index.ts` for embedding and testing.

| Module | Responsibility |
|--------|----------------|
| `boot` | argv → invocation, workspace prep, runner selection, upgrades |
| `workspace` | per-project + global dirs, settings, session paths |
| `launch` | flag grammar (`readInvocation` / `renderUsage`), `@file` attachments, credentials, model catalog & pickers |
| `conductor` | the conversation loop — turns, tool invocation, fault/retry, branch/resume, compaction |
| `window-budget` | token accounting + context-window compaction policy |
| `capability-deck` | the tool registry (read/write/bash/glob/grep/fetch/search …) |
| `runtime-bridge` | framework wiring — models, MCP, providers |
| `addons` | loadable extensions: skills & subagents |
| `console` | the interactive Ink/React surface |
| `channels` | print + line-protocol headless surfaces |
| `briefing` | system prompt / context assembly |
| `transcript-export` | session persistence + HTML/markdown export |
| `insight` | tracing (Trail / Probe / Signal), sinks, replay, secret redaction |
| `kit` | leaf helpers (image sniff, managed-binary fetch, shell quoting) |

## Zoho CRM (native MCP)

Native Zoho CRM tools are wired through the local framework package
[`indusagi/zoho`](../indus-rebuild) (`connectZohoMcp`). This agent only hosts UX
and attaches tools — OAuth + Streamable HTTP live in the framework.

### Setup

1. Create an MCP server at [zoho.com/mcp](https://www.zoho.com/mcp/) and copy the **Connect** URL.
2. Point this package at the local framework (already set in `package.json`):

   ```json
   "indusagi": "link:indusagi"
   ```

3. Build and link the local framework, then build this agent:

   ```bash
   bun run setup
   bun run build
   ```

   Run `bun run setup` once to register `../indus-rebuild` with Bun. After
   that, normal `bun install` uses the registered local link without copying
   the framework directory.

4. Configure the URL (any one of):

   ```bash
   export ZOHO_MCP_URL="https://…"          # preferred
   # or
   indus --zoho-url "https://…" …
   # or project file .indusagi/zoho.json / profile ~/.indusagi/agent/zoho.json
   ```

5. Authenticate with a model key (`MINIMAX_API_KEY`, `ANTHROPIC_API_KEY`, …) and run:

   ```bash
   node dist/entry.js -m MiniMax-M2.7 -p "list my Zoho leads"
   # interactive
   node dist/entry.js
   > /zoho status
   > /zoho connect
   > /zoho tools
   > list recent leads from Zoho
   ```

First connect may open a browser for Zoho OAuth. Tokens persist under
`~/.config/indusagi/credentials/mcp/zoho.json`.

| Flag / command | Meaning |
|----------------|---------|
| `--zoho-url <url>` | Zoho MCP URL for this run |
| `--zoho` | Force-enable when a URL is resolvable |
| `--no-zoho` / `ZOHO_DISABLED=1` | Skip Zoho attach |
| `/zoho-connect` `/zoho-disconnect` `/zoho-status` `/zoho-tools` `/zoho-help` | Separate slash commands |
| `/zoho` (+ subcommands) | Menu / legacy subcommands |

See [`ZOHO_NATIVE_PLAN.md`](./ZOHO_NATIVE_PLAN.md) for architecture and precedence.

## GitHub review agent

This package also includes `indusagi-review`, a durable GitHub pull-request
review worker powered by the Indusagi conductor and backed by Supabase. It
validates signed webhooks, reads repository context through read-only GitHub
tools, posts inline review findings and a check run, and persists retryable
jobs without Prisma.

See [REVIEW_AGENT.md](./REVIEW_AGENT.md) for GitHub App permissions, Supabase
schema, environment variables, deployment, and security details.

## Sarvam AI (native MCP)

Indian-language STT / TTS / translate / vision tools via local
[`indusagi/sarvam-mcp`](../indus-rebuild) (`connectSarvamMcp` → `uvx sarvam-mcp`).

### Setup

1. Install [uv](https://docs.astral.sh/uv/) (provides `uvx`).
2. Get a key from [dashboard.sarvam.ai/key-management](https://dashboard.sarvam.ai/key-management).
3. Framework already linked: `"indusagi": "link:indusagi"`.

```bash
export SARVAM_API_KEY=…
export MINIMAX_API_KEY=…   # host LLM

node dist/entry.js
> /sarvam-connect
> /sarvam-tools
> Translate "good morning" to Hindi
```

First connect may take 30–60s while `uvx` downloads `sarvam-mcp`.

| Flag / command | Meaning |
|----------------|---------|
| `--sarvam` | Force-enable when key is resolvable |
| `--no-sarvam` / `SARVAM_DISABLED=1` | Skip Sarvam attach |
| `--sarvam-key <key>` | One-shot key (prefer env) |
| `--sarvam-base-path <dir>` | TTS/docs output dir (default `~/Desktop`) |
| `/sarvam-connect` `/sarvam-disconnect` `/sarvam-status` `/sarvam-tools` `/sarvam-help` | Separate slash commands |
| `/sarvam` | Menu of all Sarvam commands |

See [`SARVAM_NATIVE_PLAN.md`](./SARVAM_NATIVE_PLAN.md).

## Clean-room posture

`npm run lineage-scan` runs `scripts/lineage-scan.mjs`, which walks `src/` and
exits non-zero if any non-test file carries an external-source marker. Test files are
excluded by design — several of them assert the *absence* of those markers. The
scan is part of every release check.

## License

AGPL-3.0 — see [`LICENSE`](./LICENSE), [`NOTICE`](./NOTICE), and [`CREDITS.md`](./CREDITS.md).

Private and internal company use is permitted. If you distribute a modified version over a network
(including as a hosted/SAAS service), the AGPL requires you to release the complete corresponding
source code of that modified version under AGPL-3.0 as well.
