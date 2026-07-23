/**
 * Attach Sarvam MCP tools to the coding agent via indusagi/sarvam-mcp.
 */

import { connectSarvamMcp } from "indusagi/sarvam-mcp";
import { createMCPAgentToolFactory } from "indusagi/mcp";
import type { SarvamAttachResult, SarvamHostConfig } from "./types.js";
import { resolveSarvamConfig, redactApiKey, type ResolveSarvamOptions } from "./config.js";

/** Live connection handle for /sarvam status and disconnect. */
let live: {
  id: string;
  toolNames: readonly string[];
  close: () => Promise<void>;
  keyRedacted: string;
  basePath?: string;
} | null = null;

let connecting = false;
let cancelConnect = false;

export function getLiveSarvam(): typeof live {
  return live;
}

export function isSarvamConnecting(): boolean {
  return connecting;
}

/**
 * Convert a connected Sarvam MCP client into AgentTool[] using the same factory
 * the coding agent uses for generic MCP servers.
 */
async function toolsFromConnection(
  conn: Awaited<ReturnType<typeof connectSarvamMcp>>,
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
    console.error(`[sarvam] listTools/factory failed: ${message}`);
  }
  return tools;
}

export interface AttachSarvamOptions {
  closables?: Array<() => Promise<void>>;
  onStatus?: (message: string) => void;
}

/**
 * Connect to Sarvam MCP (spawns uvx sarvam-mcp) and return AgentTool-compatible tools.
 */
export async function attachSarvamTools(
  config: SarvamHostConfig,
  opts?: AttachSarvamOptions,
): Promise<SarvamAttachResult> {
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
  opts?.onStatus?.(
    "Spawning uvx sarvam-mcp… (first run may download the package, ~30–60s)",
  );

  try {
    const conn = await connectSarvamMcp({
      apiKey: config.apiKey,
      id: config.id ?? "sarvam",
      baseUrl: config.baseUrl,
      basePath: config.basePath,
      command: config.command,
      args: config.args,
      timeoutMs: 120_000,
    });

    if (cancelConnect) {
      try {
        await conn.close();
      } catch {
        /* ignore */
      }
      throw new Error("Sarvam connect cancelled (disconnect).");
    }

    const tools = await toolsFromConnection(conn);
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
        if (live?.id === (config.id ?? "sarvam")) live = null;
      }
    };

    opts?.closables?.push(close);

    const keyRedacted = config.apiKey ? redactApiKey(config.apiKey) : "(env)";

    live = {
      id: config.id ?? "sarvam",
      toolNames,
      close,
      keyRedacted,
      basePath: config.basePath,
    };

    return { tools, toolNames, id: config.id ?? "sarvam", close };
  } finally {
    connecting = false;
  }
}

/**
 * Session helper: resolve config and attach, or return [] if Sarvam is off.
 * Soft-fails so missing uvx / bad key does not crash the coding agent.
 */
export async function loadSarvamAgentTools(opts: {
  cwd: string;
  closables?: Array<() => Promise<void>>;
  sarvamKey?: string;
  noSarvam?: boolean;
  forceSarvam?: boolean;
  basePath?: string;
}): Promise<unknown[]> {
  const resolveOpts: ResolveSarvamOptions = {
    cwd: opts.cwd,
    apiKey: opts.sarvamKey,
    disabled: opts.noSarvam,
    forceEnable: opts.forceSarvam,
    basePath: opts.basePath,
  };
  const config = resolveSarvamConfig(resolveOpts);
  if (!config) return [];

  try {
    const result = await attachSarvamTools(config, { closables: opts.closables });
    return [...result.tools];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[sarvam] failed to attach: ${message}`);
    if (/uvx|ENOENT|spawn/i.test(message)) {
      console.error(
        "[sarvam] Install uv (provides uvx): https://docs.astral.sh/uv/  then re-run /sarvam-connect",
      );
    }
    return [];
  }
}

export async function disconnectLiveSarvam(): Promise<boolean> {
  if (connecting) {
    cancelConnect = true;
  }
  if (!live) {
    return connecting;
  }
  try {
    await live.close();
  } catch {
    /* ignore */
  }
  live = null;
  return true;
}

export function sarvamStatusLines(): string {
  if (connecting) {
    return [
      "Sarvam MCP: connecting… (spawning uvx sarvam-mcp)",
      "First run may download the Python package (~30–60s).",
      "Run /sarvam-disconnect to cancel.",
    ].join("\n");
  }
  if (!live) {
    return [
      "Sarvam MCP: not connected.",
      "Set SARVAM_API_KEY or run /sarvam-connect [key].",
      "Requires uv/uvx: https://docs.astral.sh/uv/",
      "Key: https://dashboard.sarvam.ai/key-management",
      "",
      "Commands: /sarvam-connect · /sarvam-disconnect · /sarvam-status · /sarvam-tools · /sarvam-help",
    ].join("\n");
  }
  return [
    `Sarvam MCP: connected (id=${live.id}).`,
    `API key: ${live.keyRedacted}`,
    live.basePath ? `Base path: ${live.basePath}` : "Base path: ~/Desktop (default)",
    `Tools (${live.toolNames.length}):`,
    ...live.toolNames.map((n) => `  • ${n}`),
    "",
    "Run /sarvam-disconnect to close the connection.",
  ].join("\n");
}

export function sarvamConnectingText(): string {
  return [
    "Sarvam MCP — connecting",
    "",
    "Spawning: uvx sarvam-mcp",
    "First run may download the package (30–60 seconds).",
    "",
    "Prerequisites:",
    "  • uv installed → https://docs.astral.sh/uv/",
    "  • SARVAM_API_KEY from https://dashboard.sarvam.ai/key-management",
    "",
    "Cancel: /sarvam-disconnect",
  ].join("\n");
}
