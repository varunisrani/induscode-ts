/**
 * Integration slash commands — auth launchers, the external bridges, and the
 * clipboard / export / share I/O verbs.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { createMCPAgentToolFactory, loadMCPConfig, MCPClientPool } from "indusagi/mcp";
import { createComposioGateway } from "indusagi/connectors-saas";
import type { SlashCommand, SlashContext } from "../../contract.js";
import { FAMILY, HANDLED, familyRunner, info, warn, splitVerb } from "./shared.js";
import { publishTranscript } from "../../../transcript-export/index.js";
import { APP_NOVEL_CARDS, memoryCard } from "../../../capability-deck/index.js";
import { getServerToken, hasValidServerToken, INDUS_SERVER_URL } from "../../../boot/server-token.js";
import { isGatewayEligibleProvider } from "../../../boot/runners/server-mode.js";

const CLIPBOARD_WRITERS: Array<{ bin: string; args: string[] }> = [
  { bin: "pbcopy", args: [] },
  { bin: "clip", args: [] },
  { bin: "xclip", args: ["-selection", "clipboard"] },
  { bin: "wl-copy", args: [] }
];

const PUBLISH_ROLES = new Set(["user", "assistant", "tool", "system", "condense", "note"]);

let mcpPool: MCPClientPool | undefined;
let mcpServers: ReturnType<typeof loadMCPConfig> = [];

let memoryEnabled = true;

const COMPOSIO_ENV_KEY = "COMPOSIO_API_KEY";
let composioGateway: ReturnType<typeof createComposioGateway> | undefined;
let composioResolved = false;

function writeClipboard(text: string): boolean {
  for (const writer of CLIPBOARD_WRITERS) {
    try {
      const result = spawnSync(writer.bin, [...writer.args], {
        input: text,
        encoding: "utf-8"
      });
      if (!result.error && result.status === 0) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function lastAssistantText(messages: any[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "assistant") continue;
    const content = message.content;
    if (!Array.isArray(content)) continue;
    const text = content
      .filter(
        (b) => typeof b === "object" && b !== null && b.type === "text" && typeof b.text === "string"
      )
      .map((b) => b.text)
      .join("")
      .trim();
    return text;
  }
  return "";
}

function toPublishRole(role: string): string {
  return PUBLISH_ROLES.has(role) ? role : "note";
}

function toPublishEntries(messages: any[]) {
  return messages.map((message) => {
    const m = message;
    return {
      role: toPublishRole(m.role),
      message: {
        role: m.role,
        content: typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content : "",
        ...(typeof m.toolCallId === "string" ? { toolCallId: m.toolCallId } : {}),
        ...(typeof m.toolName === "string" ? { toolName: m.toolName } : {})
      }
    };
  });
}

function defaultExportPath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").replace(/Z$/, "");
  return resolve(process.cwd(), `transcript-${stamp}.html`);
}

function exportTranscriptHtml(ctx: SlashContext, target: string): { ok: boolean; path?: string; reason?: string } {
  const messages = ctx.conductor.messages();
  if (messages.length === 0) {
    return { ok: false, reason: "Nothing to export yet — the transcript is empty." };
  }
  const outPath = target.length > 0 ? resolve(process.cwd(), target) : defaultExportPath();
  try {
    const html = publishTranscript(toPublishEntries(messages), {
      title: "Session Transcript"
    });
    writeFileSync(outPath, html, "utf-8");
    return { ok: true, path: outPath };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, reason: `Could not write the HTML export: ${message}` };
  }
}

function loadMcpPool() {
  mcpServers = loadMCPConfig(process.cwd());
  mcpPool = new MCPClientPool({ servers: mcpServers });
  return mcpPool;
}

function ensureMcpPool() {
  return mcpPool ?? loadMcpPool();
}

async function gatherMcpStatus() {
  if (mcpServers.length === 0 && mcpPool === void 0) {
    mcpServers = loadMCPConfig(process.cwd());
  }
  if (mcpServers.length === 0) {
    return "No MCP servers are configured.\nAdd one to .indusvx/mcp.json, then run /mcp connect.";
  }
  const pool = mcpPool;
  const lines: string[] = [`Configured MCP servers (${mcpServers.length}):`];
  let toolsByServer: Record<string, Array<{ name: string }>> = {};
  if (pool !== void 0) {
    try {
      toolsByServer = await pool.listAllTools();
    } catch {
      toolsByServer = {};
    }
  }
  for (const server of mcpServers) {
    const connected = pool?.isConnected(server.name) ?? false;
    const state = connected ? "connected" : "not connected";
    lines.push(`  • ${server.name} — ${state}`);
    const tools = toolsByServer[server.name] ?? [];
    if (tools.length > 0) {
      lines.push(`      tools: ${tools.map((t) => t.name).join(", ")}`);
    }
  }
  return lines.join("\n");
}

async function mcpPoolTools(pool: MCPClientPool) {
  const tools: any[] = [];
  for (const client of pool.getAllClients()) {
    try {
      const defs = await client.listTools();
      for (const def of defs) tools.push(createMCPAgentToolFactory(def, client)());
    } catch {
      // ignore
    }
  }
  return tools;
}

function openMcpOverlay(ctx: SlashContext, text: string) {
  ctx.openModal("plugin", { surface: "mcp", title: "MCP servers", text });
}

async function runMcp(ctx: SlashContext) {
  const verb = ctx.args.trim().toLowerCase() || "status";
  try {
    switch (verb) {
      case "connect":
      case "reconnect": {
        const pool = verb === "reconnect" ? loadMcpPool() : ensureMcpPool();
        await pool.connectAll();
        ctx.conductor.registerTools(await mcpPoolTools(pool));
        const text = await gatherMcpStatus();
        ctx.setStatus(info(`MCP ${verb}ed.`));
        openMcpOverlay(ctx, text);
        return HANDLED;
      }
      case "disconnect": {
        if (mcpPool === void 0) {
          ctx.setStatus(info("No MCP connections are open."));
          return HANDLED;
        }
        await mcpPool.disconnectAll();
        ctx.conductor.registerTools([]);
        ctx.setStatus(info("Disconnected from all MCP servers."));
        openMcpOverlay(ctx, await gatherMcpStatus());
        return HANDLED;
      }
      case "tools": {
        const pool = ensureMcpPool();
        let toolsByServer: Record<string, Array<{ name: string }>> = {};
        try {
          toolsByServer = await pool.listAllTools();
        } catch {
          toolsByServer = {};
        }
        const names = Object.values(toolsByServer).flatMap((list) => list.map((t) => t.name));
        const text =
          names.length === 0
            ? "No MCP tools are loaded. Run /mcp connect first."
            : `Loaded MCP tools (${names.length}):\n  ${names.join("\n  ")}`;
        openMcpOverlay(ctx, text);
        return HANDLED;
      }
      case "status":
      case "":
        openMcpOverlay(ctx, await gatherMcpStatus());
        return HANDLED;
      default:
        ctx.setStatus(warn("/mcp expects: connect, reconnect, disconnect, tools, or status."));
        return HANDLED;
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    ctx.setStatus(warn(`MCP ${verb} failed: ${message}`));
    return HANDLED;
  }
}

function memoryToolNames() {
  const id = memoryCard.id;
  return Array.from(new Set([id, "memory"]));
}

function memoryPresent() {
  return APP_NOVEL_CARDS.some((card: any) => card.id === memoryCard.id);
}

function gatherMemoryStatus() {
  const present = memoryPresent();
  if (!present) {
    return "The working-memory capability is not registered in this build.";
  }
  const lines = [
    `Working memory: ${memoryEnabled ? "active" : "inactive"}.`,
    `Tool: ${memoryToolNames().join(", ")}.`,
    memoryCard.summary
  ];
  return lines.join("\n");
}

function openMemoryOverlay(ctx: SlashContext, text: string) {
  ctx.openModal("plugin", { surface: "memory", title: "Working memory", text });
}

const MEMORY_SUBS = [
  {
    verb: "status",
    describe: "show memory state + tool",
    run(ctx: SlashContext) {
      openMemoryOverlay(ctx, gatherMemoryStatus());
      return HANDLED;
    }
  },
  {
    verb: "on",
    describe: "mark memory active",
    run(ctx: SlashContext) {
      if (!memoryPresent()) {
        ctx.setStatus(warn("No working-memory capability to enable in this build."));
        return HANDLED;
      }
      memoryEnabled = true;
      ctx.setStatus(info("Working memory marked active."));
      openMemoryOverlay(ctx, gatherMemoryStatus());
      return HANDLED;
    }
  },
  {
    verb: "off",
    describe: "mark memory inactive",
    run(ctx: SlashContext) {
      if (!memoryPresent()) {
        ctx.setStatus(warn("No working-memory capability to disable in this build."));
        return HANDLED;
      }
      memoryEnabled = false;
      ctx.setStatus(info("Working memory marked inactive."));
      openMemoryOverlay(ctx, gatherMemoryStatus());
      return HANDLED;
    }
  },
  {
    verb: "tools",
    describe: "list memory tool names",
    run(ctx: SlashContext) {
      const text = memoryPresent()
        ? `Working-memory tools:\n  ${memoryToolNames().join("\n  ")}`
        : "No working-memory capability is registered in this build.";
      openMemoryOverlay(ctx, text);
      return HANDLED;
    }
  }
];

function ensureComposioGateway() {
  if (composioResolved) return composioGateway;
  composioResolved = true;
  const apiKey = process.env[COMPOSIO_ENV_KEY]?.trim();
  if (apiKey === void 0 || apiKey.length === 0) {
    composioGateway = void 0;
    return void 0;
  }
  try {
    composioGateway = createComposioGateway({ apiKey });
  } catch {
    composioGateway = void 0;
  }
  return composioGateway;
}

function openComposioOverlay(ctx: SlashContext, text: string) {
  ctx.openModal("plugin", { surface: "composio", title: "Composio", text });
}

async function gatherComposioStatus(gateway: any) {
  const report = await gateway.status();
  const lines: string[] = [];
  if (report.accounts.length === 0) {
    lines.push("No connected accounts.");
  } else {
    lines.push(`Connected accounts (${report.accounts.length}):`);
    for (const account of report.accounts) {
      lines.push(`  • ${account.toolkit} — ${account.status} (${account.id})`);
    }
  }
  lines.push(
    report.enabledTools.length === 0
      ? "No remote tools enabled yet. Run /composio enable <toolkit>."
      : `Enabled tools (${report.enabledTools.length}): ${report.enabledTools.join(", ")}`
  );
  return lines.join("\n");
}

const COMPOSIO_NO_KEY = `Composio is not configured. Export ${COMPOSIO_ENV_KEY} with a Composio API key, then re-run /composio connect.`;

const COMPOSIO_SUBS = [
  {
    verb: "status",
    describe: "show accounts + tools",
    run(ctx: SlashContext) {
      const gateway = ensureComposioGateway();
      if (gateway === void 0) {
        ctx.setStatus(warn("Composio is not configured."));
        openComposioOverlay(ctx, COMPOSIO_NO_KEY);
        return HANDLED;
      }
      void gatherComposioStatus(gateway)
        .then((text) => openComposioOverlay(ctx, text))
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          openComposioOverlay(ctx, `Could not read Composio status: ${message}`);
        });
      return HANDLED;
    }
  },
  {
    verb: "accounts",
    describe: "list connected accounts",
    run(ctx: SlashContext) {
      const gateway = ensureComposioGateway();
      if (gateway === void 0) {
        openComposioOverlay(ctx, COMPOSIO_NO_KEY);
        return HANDLED;
      }
      void gateway
        .status()
        .then((report: any) => {
          const text =
            report.accounts.length === 0
              ? "No connected Composio accounts."
              : `Connected accounts (${report.accounts.length}):\n` +
                report.accounts.map((a: any) => `  • ${a.toolkit} — ${a.status} (${a.id})`).join("\n");
          openComposioOverlay(ctx, text);
        })
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          openComposioOverlay(ctx, `Could not list accounts: ${message}`);
        });
      return HANDLED;
    }
  },
  {
    verb: "tools",
    describe: "list enabled tool names",
    run(ctx: SlashContext) {
      const gateway = ensureComposioGateway();
      if (gateway === void 0) {
        openComposioOverlay(ctx, COMPOSIO_NO_KEY);
        return HANDLED;
      }
      void gateway
        .status()
        .then((report: any) => {
          const text =
            report.enabledTools.length === 0
              ? "No Composio tools enabled. Run /composio enable <toolkit>."
              : `Enabled Composio tools (${report.enabledTools.length}):\n  ${report.enabledTools.join("\n  ")}`;
          openComposioOverlay(ctx, text);
        })
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          openComposioOverlay(ctx, `Could not list tools: ${message}`);
        });
      return HANDLED;
    }
  },
  {
    verb: "connect",
    describe: "link a toolkit",
    run(ctx: SlashContext, rest: string) {
      const toolkit = rest.trim();
      if (toolkit.length === 0) {
        ctx.setStatus(warn("/composio connect expects: <toolkit> to link."));
        return HANDLED;
      }
      const gateway = ensureComposioGateway();
      if (gateway === void 0) {
        openComposioOverlay(ctx, COMPOSIO_NO_KEY);
        return HANDLED;
      }
      ctx.setStatus(info(`Starting Composio connect for ${toolkit}...`));
      void gateway
        .connect(toolkit)
        .then((report: any) => {
          const lines: string[] = [`Connect ${toolkit}: ${report.action}.`];
          if (report.authUrl) lines.push(`Authorize at: ${report.authUrl}`);
          if (report.accountId) lines.push(`Account: ${report.accountId}`);
          if (report.reason) lines.push(`Reason: ${report.reason}`);
          openComposioOverlay(ctx, lines.join("\n"));
        })
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          openComposioOverlay(ctx, `Composio connect failed: ${message}`);
        });
      return HANDLED;
    }
  },
  {
    verb: "enable",
    describe: "hydrate a toolkit's tools",
    run(ctx: SlashContext, rest: string) {
      const toolkit = rest.trim();
      if (toolkit.length === 0) {
        ctx.setStatus(warn("/composio enable expects: <toolkit> to hydrate."));
        return HANDLED;
      }
      const gateway = ensureComposioGateway();
      if (gateway === void 0) {
        openComposioOverlay(ctx, COMPOSIO_NO_KEY);
        return HANDLED;
      }
      ctx.setStatus(info(`Enabling Composio toolkit ${toolkit}...`));
      void gateway
        .enable(toolkit)
        .then((report: any) => {
          const text =
            report.hydrated.length === 0
              ? `Toolkit ${toolkit} exposed no tools.`
              : `Enabled ${report.toolkit} (${report.hydrated.length} tools${report.cached ? ", cached" : ""}):\n  ${report.hydrated.join("\n  ")}`;
          openComposioOverlay(ctx, text);
        })
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          openComposioOverlay(ctx, `Composio enable failed: ${message}`);
        });
      return HANDLED;
    }
  }
];

function runCopy(ctx: SlashContext) {
  const text = lastAssistantText(ctx.conductor.messages());
  if (text.length === 0) {
    ctx.setStatus(warn("Nothing to copy yet — no assistant reply on screen."));
    return HANDLED;
  }
  if (!writeClipboard(text)) {
    ctx.setStatus(warn("Could not reach a clipboard tool on this system."));
    return HANDLED;
  }
  ctx.setStatus(info("Copied the last reply to your clipboard."));
  return HANDLED;
}

function runExport(ctx: SlashContext) {
  const result = exportTranscriptHtml(ctx, ctx.args.trim());
  if (!result.ok) {
    ctx.setStatus(warn(result.reason!));
    return HANDLED;
  }
  ctx.setStatus({ kind: "success", text: `Exported transcript to ${result.path}` });
  return HANDLED;
}

function runShare(ctx: SlashContext) {
  const exported = exportTranscriptHtml(ctx, "");
  if (!exported.ok) {
    ctx.setStatus(warn(exported.reason!));
    return HANDLED;
  }
  let result: ReturnType<typeof spawnSync>;
  try {
    result = spawnSync("gh", ["gist", "create", exported.path!, "--public=false"], {
      encoding: "utf-8"
    });
  } catch {
    ctx.setStatus(warn(`GitHub CLI (gh) is not installed. Saved HTML locally at ${exported.path}`));
    return HANDLED;
  }
  if (result.error !== void 0 && (result.error as any).code === "ENOENT") {
    ctx.setStatus(warn(`GitHub CLI (gh) is not installed. Saved HTML locally at ${exported.path}`));
    return HANDLED;
  }
  if (result.status !== 0) {
    const stderr = String(result.stderr ?? "").trim();
    const authHint = /auth|logged in|gh auth login/i.test(stderr)
      ? "Run `gh auth login` to authenticate, then retry."
      : stderr || "gh gist create failed.";
    ctx.setStatus(warn(`Share failed: ${authHint} Saved HTML locally at ${exported.path}`));
    return HANDLED;
  }
  const url = String(result.stdout ?? "").trim().split(/\s+/)[0] ?? "";
  ctx.setStatus({
    kind: "success",
    text: url.length > 0 ? `Shared as secret gist: ${url}` : `Shared. Local HTML: ${exported.path}`
  });
  return HANDLED;
}

function runLogin(ctx: SlashContext) {
  const provider = ctx.args.trim().toLowerCase();
  if (provider.length > 0) {
    ctx.openModal("signIn", { providerId: provider });
  } else {
    ctx.openModal("signIn");
  }
  return HANDLED;
}

function hasLocalProviderKey(provider: string) {
  if (provider.length === 0) return false;
  try {
    const file = join(homedir(), ".indusagi", "agent", "auth.json");
    const vault = JSON.parse(readFileSync(file, "utf8"));
    const entry = vault[provider];
    return entry !== null && typeof entry === "object" && Object.keys(entry).length > 0;
  } catch {
    return false;
  }
}

function runStatus(ctx: SlashContext) {
  const modelId = ctx.conductor.snapshot().modelId;
  const provider = modelId.includes("/") ? modelId.split("/")[0] : modelId;
  void (async () => {
    let signedIn = false;
    try {
      signedIn = await hasValidServerToken();
    } catch {
      signedIn = false;
    }
    const eligible = isGatewayEligibleProvider(provider);
    const localKey = hasLocalProviderKey(provider);
    const viaServer = signedIn && eligible && !localKey;
    if (viaServer) {
      ctx.setStatus(info(`● server tier — ${modelId} routing via ${INDUS_SERVER_URL} (signed in)`));
    } else if (localKey) {
      ctx.setStatus(info(`○ local key — ${modelId}${signedIn ? " (signed in to server)" : ""}`));
    } else if (!signedIn) {
      ctx.setStatus(warn(`signed out — ${modelId} has no key. Run /login to use the server tier.`));
    } else {
      ctx.setStatus(info(`signed in — ${modelId} (${provider} is not gateway-eligible; needs a local key)`));
    }
  })();
  return HANDLED;
}

function runUsage(ctx: SlashContext) {
  void (async () => {
    const token = await getServerToken();
    if (!token?.access_token) {
      ctx.setStatus(warn("Not signed in to the server — run /login to use the server tier."));
      return;
    }
    try {
      const res = await fetch(`${INDUS_SERVER_URL}/api/usage`, {
        headers: { Authorization: `Bearer ${token.access_token}` }
      });
      if (!res.ok) {
        ctx.setStatus(warn(`Couldn't read usage (HTTP ${res.status}).`));
        return;
      }
      const u: any = await res.json();
      const pct = u.limit > 0 ? Math.round((u.used / u.limit) * 100) : 0;
      const line =
        `Usage this month: ${u.used.toLocaleString()} / ${u.limit.toLocaleString()} tokens (${pct}%) · ${u.remaining.toLocaleString()} left · ${u.requests} reqs · $${(u.costUsd ?? 0).toFixed(4)}` +
        (u.allowed ? "" : " · LIMIT REACHED — requests are blocked");
      ctx.setStatus(u.allowed ? info(line) : warn(line));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      ctx.setStatus(warn(`Usage check failed: ${message}`));
    }
  })();
  return HANDLED;
}

const runMemory = familyRunner(FAMILY.memory, MEMORY_SUBS);
const runComposio = familyRunner(FAMILY.composio, COMPOSIO_SUBS);

export const integrationCommands: SlashCommand[] = [
  {
    name: "login",
    summary: "Sign in to a model provider.",
    takesArgs: true,
    run(ctx) {
      return runLogin(ctx);
    }
  },
  {
    name: "logout",
    summary: "Sign out: pick a provider account or the Indus Server session to clear.",
    run(ctx) {
      ctx.openModal("signOut");
      return HANDLED;
    }
  },
  {
    name: "status",
    summary: "Show the server session and whether this model uses the server.",
    run(ctx) {
      return runStatus(ctx);
    }
  },
  {
    name: "usage",
    summary: "Show your server usage this month (tokens used / limit / cost).",
    run(ctx) {
      return runUsage(ctx);
    }
  },
  {
    name: "mcp",
    summary: "Manage MCP servers and their tools.",
    takesArgs: true,
    run(ctx) {
      return runMcp(ctx);
    }
  },
  {
    name: "memory",
    summary: "Inspect and toggle the working-memory capability.",
    family: FAMILY.memory,
    takesArgs: true,
    run(ctx) {
      return runMemory(ctx);
    }
  },
  {
    name: "composio",
    summary: "Connect and inspect Composio app bridges.",
    family: FAMILY.composio,
    takesArgs: true,
    run(ctx) {
      return runComposio(ctx);
    }
  },
  {
    name: "copy",
    summary: "Copy the last reply to the clipboard.",
    run(ctx) {
      return runCopy(ctx);
    }
  },
  {
    name: "export",
    summary: "Export the transcript to an HTML file.",
    takesArgs: true,
    run(ctx) {
      return runExport(ctx);
    }
  },
  {
    name: "share",
    summary: "Share the session as a secret GitHub gist.",
    run(ctx) {
      return runShare(ctx);
    }
  }
];
// Re-export shared verbs used internally
export { splitVerb };