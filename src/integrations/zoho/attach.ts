/**
 * Attach Zoho MCP tools to the coding agent via indusagi/zoho.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { connectZohoMcp } from "indusagi/zoho";
import { createMCPAgentToolFactory } from "indusagi/mcp";
import type { ZohoAttachResult, ZohoHostConfig } from "./types.js";
import { resolveZohoConfig, type ResolveZohoOptions } from "./config.js";

/** Live connection handle for /zoho status and disconnect. */
let live: {
  id: string;
  toolNames: readonly string[];
  close: () => Promise<void>;
  urlRedacted: string;
} | null = null;

/** In-flight connect (so disconnect / UI can track). */
let connecting = false;
/** If true, tear down as soon as connect resolves. */
let cancelConnect = false;
/** Last OAuth authorize URL shown to the user (for overlay / status). */
let lastAuthUrl: string | undefined;

export function getLiveZoho(): typeof live {
  return live;
}

export function isZohoConnecting(): boolean {
  return connecting;
}

export function getLastZohoAuthUrl(): string | undefined {
  return lastAuthUrl;
}

/** Default credentials path used by the framework OAuth provider. */
function zohoTokenPath(id = "zoho"): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const home = process.env.HOME ?? process.env.USERPROFILE ?? homedir();
  const dir =
    xdg && xdg.length > 0
      ? join(xdg, "indusagi", "credentials", "mcp")
      : join(home, ".config", "indusagi", "credentials", "mcp");
  return join(dir, `${id.replace(/[^a-zA-Z0-9._-]/g, "-")}.json`);
}

/**
 * True when a usable access_token is already on disk (skip browser at boot).
 */
export function hasUsableZohoTokens(id = "zoho"): boolean {
  const path = zohoTokenPath(id);
  try {
    if (!existsSync(path)) return false;
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as { tokens?: { access_token?: string } };
    return typeof parsed?.tokens?.access_token === "string" && parsed.tokens.access_token.length > 0;
  } catch {
    return false;
  }
}

function extractAuthUrl(message: string): string | undefined {
  // Framework logs: "oauth: open this URL…\n  https://…"
  const multi = message.match(/https?:\/\/[^\s]+/g);
  if (!multi || multi.length === 0) return undefined;
  // Prefer the authorize URL (not the local callback).
  const auth = multi.find((u) => !u.includes("127.0.0.1") && !u.includes("localhost"));
  return auth ?? multi[0];
}

/**
 * Convert a connected Zoho MCP client into AgentTool[] using the same factory
 * the coding agent uses for generic MCP servers (`createMCPAgentToolFactory`).
 * Tool names become `{serverName}_{mcpToolName}` (e.g. zoho_getLeadsRecords).
 */
async function toolsFromConnection(
  conn: Awaited<ReturnType<typeof connectZohoMcp>>,
): Promise<unknown[]> {
  const tools: unknown[] = [];
  const client = conn.client as {
    listTools: () => Promise<
      Array<{ name: string; description?: string; inputSchema: Record<string, unknown> }>
    >;
    serverName: string;
    connected: boolean;
    callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  };

  try {
    const defs = await client.listTools();
    for (const def of defs) {
      const factory = createMCPAgentToolFactory(def, client as never);
      tools.push(factory());
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[zoho] listTools/factory failed: ${message}`);
  }
  return tools;
}

export interface AttachZohoOptions {
  closables?: Array<() => Promise<void>>;
  /** Always try to open the system browser (default true for interactive). */
  openBrowser?: boolean;
  /** Called when framework logs OAuth progress (includes authorize URL). */
  onAuthMessage?: (message: string) => void;
  /** Called when an authorize URL is detected. */
  onAuthUrl?: (url: string) => void;
}

/**
 * Connect to Zoho MCP and return AgentTool-compatible tools.
 * Registers close on opts.closables when provided.
 */
export async function attachZohoTools(
  config: ZohoHostConfig,
  opts?: AttachZohoOptions,
): Promise<ZohoAttachResult> {
  // Tear down previous live connection if any
  if (live) {
    try {
      await live.close();
    } catch {
      /* ignore */
    }
    live = null;
  }

  connecting = true;
  cancelConnect = false;
  lastAuthUrl = undefined;

  const onAuthMessage = opts?.onAuthMessage;
  const onAuthUrl = opts?.onAuthUrl;
  const openBrowser = opts?.openBrowser !== false;

  const handleLog = (msg: string) => {
    try {
      onAuthMessage?.(msg);
    } catch {
      /* ignore UI errors */
    }
    const url = extractAuthUrl(msg);
    if (url) {
      lastAuthUrl = url;
      try {
        onAuthUrl?.(url);
      } catch {
        /* ignore */
      }
    }
  };

  try {
    const conn = await connectZohoMcp({
      url: config.url,
      id: config.id ?? "zoho",
      auth: config.auth ?? "auto",
      timeoutMs: 60_000,
      // Force browser open for interactive connect (don't gate only on isTTY).
      openBrowser,
      logger: {
        debug: (msg) => handleLog(msg),
        error: (msg, err) => {
          const detail = err instanceof Error ? err.message : err !== undefined ? String(err) : "";
          handleLog(detail ? `${msg}: ${detail}` : msg);
          console.error(`[zoho error] ${msg}${detail ? `: ${detail}` : ""}`);
        },
      },
    });

    if (cancelConnect) {
      try {
        await conn.close();
      } catch {
        /* ignore */
      }
      throw new Error("Zoho connect cancelled (disconnect).");
    }

    const tools = await toolsFromConnection(conn);
    // Prefer names the agent actually calls (createMCPAgentToolFactory),
    // fall back to framework-prefixed names from connectZohoMcp.
    const fromTools = tools
      .map((t) => (t as { name?: string }).name)
      .filter((n): n is string => typeof n === "string" && n.length > 0);
    const toolNames =
      fromTools.length > 0
        ? fromTools
        : conn.toolNames.length > 0
          ? [...conn.toolNames]
          : [];

    const close = async () => {
      try {
        await conn.close();
      } finally {
        if (live?.id === (config.id ?? "zoho")) live = null;
      }
    };

    opts?.closables?.push(close);

    let urlRedacted = config.url;
    try {
      const u = new URL(config.url);
      urlRedacted = `${u.protocol}//${u.host}/…`;
    } catch {
      urlRedacted = "(url)";
    }

    live = {
      id: config.id ?? "zoho",
      toolNames,
      close,
      urlRedacted,
    };

    return { tools, toolNames, id: config.id ?? "zoho", close };
  } finally {
    connecting = false;
  }
}

/**
 * Session helper: resolve config and attach, or return [] if Zoho is off.
 *
 * Boot-safe: if there is no usable OAuth token yet, skip auto-attach so we
 * never hang the CLI for 5 minutes waiting for a browser. Interactive
 * `/zoho connect` still runs the full OAuth flow.
 */
export async function loadZohoAgentTools(opts: {
  cwd: string;
  closables?: Array<() => Promise<void>>;
  /** From invocation flags */
  zohoUrl?: string;
  noZoho?: boolean;
  forceZoho?: boolean;
  /** Allow browser OAuth during load (default false — use /zoho connect). */
  allowBrowserOAuth?: boolean;
}): Promise<unknown[]> {
  const resolveOpts: ResolveZohoOptions = {
    cwd: opts.cwd,
    url: opts.zohoUrl,
    disabled: opts.noZoho,
    forceEnable: opts.forceZoho,
  };
  const config = resolveZohoConfig(resolveOpts);
  if (!config) return [];

  const allowBrowser = opts.allowBrowserOAuth === true;
  if (!allowBrowser && !hasUsableZohoTokens(config.id ?? "zoho")) {
    // Soft skip: user has URL configured but has not completed OAuth yet.
    console.error(
      "[zoho] URL configured but no OAuth tokens yet — run /zoho-connect to authorize in the browser.",
    );
    return [];
  }

  try {
    const result = await attachZohoTools(config, {
      closables: opts.closables,
      openBrowser: allowBrowser,
    });
    return [...result.tools];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[zoho] failed to attach: ${message}`);
    return [];
  }
}

export async function disconnectLiveZoho(): Promise<boolean> {
  // Cancel in-flight connect if any
  if (connecting) {
    cancelConnect = true;
  }
  if (!live) {
    return connecting; // "was connecting" still counts as handled
  }
  try {
    await live.close();
  } catch {
    /* ignore */
  }
  live = null;
  return true;
}

export function zohoStatusLines(): string {
  if (connecting) {
    const lines = [
      "Zoho MCP: connecting… (OAuth may open your browser)",
      "Complete login in the browser, then wait for tools to load.",
      "Run /zoho-disconnect to cancel.",
    ];
    if (lastAuthUrl) {
      lines.push("", "If the browser did not open, visit this URL:", `  ${lastAuthUrl}`);
    }
    return lines.join("\n");
  }
  if (!live) {
    return [
      "Zoho MCP: not connected.",
      "Set ZOHO_MCP_URL or run /zoho-connect <url>.",
      "Tokens (after OAuth): ~/.config/indusagi/credentials/mcp/zoho.json",
      "",
      "Commands: /zoho-connect · /zoho-disconnect · /zoho-status · /zoho-tools · /zoho-help",
    ].join("\n");
  }
  return [
    `Zoho MCP: connected (id=${live.id}).`,
    `Endpoint: ${live.urlRedacted}`,
    `Tools (${live.toolNames.length}):`,
    ...live.toolNames.map((n) => `  • ${n}`),
    "",
    "Run /zoho-disconnect to close the connection.",
  ].join("\n");
}

/** Overlay text while waiting for browser OAuth. */
export function zohoOAuthPendingText(authUrl?: string): string {
  const url = authUrl ?? lastAuthUrl;
  return [
    "Zoho OAuth — authorize in your browser",
    "",
    "1. A browser window should open automatically.",
    "2. Sign in to Zoho and approve access.",
    "3. Return here — tools load when the callback succeeds.",
    "",
    url
      ? `Open this URL if the browser did not open:\n\n  ${url}`
      : "Waiting for authorize URL from Zoho…",
    "",
    "Timeout: 5 minutes.  ·  Cancel: /zoho-disconnect",
  ].join("\n");
}
