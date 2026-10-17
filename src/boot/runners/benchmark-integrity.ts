import { appendFileSync } from "node:fs";
import path from "node:path";
import type { AgentTool } from "../../addons/index.js";

type BenchmarkEnv = Readonly<Record<string, string | undefined>>;

const GUARDED_TOOLS = new Set(["read", "write", "edit", "grep", "find", "ls", "bash"]);
const PATH_KEYS = new Set(["path", "file", "file_path", "directory", "dir", "cwd", "search_path"]);
const FORBIDDEN_ABSOLUTE = [
  "/tests",
  "/solution",
  "/solutions",
  "/reference",
  "/reference_solution",
  "/reference-solutions",
  "/reward.txt",
  "/rewards",
  "/grader",
  "/verifier",
];
const FORBIDDEN_BASENAMES = new Set([
  "solution.sh",
  "solve.sh",
  "reward.txt",
  "expected_answer.txt",
  "expected_output.txt",
]);

function normalizeCandidate(value: string, cwd: string): string {
  return path.resolve(cwd, value);
}

function forbiddenPath(value: string, cwd: string): boolean {
  const resolved = normalizeCandidate(value, cwd);
  const base = path.basename(resolved).toLowerCase();
  if (FORBIDDEN_BASENAMES.has(base)) return true;
  return FORBIDDEN_ABSOLUTE.some((prefix) => resolved === prefix || resolved.startsWith(`${prefix}/`));
}

function pathValues(args: unknown): string[] {
  if (args === null || typeof args !== "object" || Array.isArray(args)) return [];
  const values: string[] = [];
  for (const [key, value] of Object.entries(args as Record<string, unknown>)) {
    if (PATH_KEYS.has(key) && typeof value === "string") values.push(value);
  }
  return values;
}

function forbiddenShell(command: string, cwd: string): boolean {
  const lower = command.toLowerCase();
  if ([...FORBIDDEN_BASENAMES].some((name) => lower.includes(name))) return true;
  if (FORBIDDEN_ABSOLUTE.some((prefix) => new RegExp(`(^|[\\s'\"=])${prefix.replaceAll("/", "\\/")}(?:[/\\s'\";|&]|$)`, "i").test(command))) return true;
  if (/(^|[\s'"=])\.\.\/(?:tests|solutions?|reference(?:[-_]solutions?)?|grader|verifier)(?:[/\s'";|&]|$)/i.test(command)) return true;
  if (/\b(?:find|ls|grep|rg)\s+(?:-[^\s]+\s+)*\/(?:\s|$)/i.test(command)) return true;
  const retrievesOnline = /\b(?:curl|wget|git\s+clone|gh\s+repo\s+clone)\b/i.test(command);
  const benchmarkMaterial = /terminal[-_ ]bench|reference[-_ ]solution|solution\.sh|solve\.sh|benchmark[-_ ]solution/i.test(command);
  if (retrievesOnline && benchmarkMaterial) return true;
  return false;
}

function denialReason(tool: string, args: unknown, cwd: string): string | undefined {
  if (tool === "bash") {
    const command = typeof (args as { command?: unknown } | null)?.command === "string"
      ? (args as { command: string }).command
      : "";
    if (forbiddenShell(command, cwd)) return "Terminal-Bench integrity guard blocked benchmark-owned or solution material.";
    return undefined;
  }
  if (pathValues(args).some((candidate) => forbiddenPath(candidate, cwd))) {
    return "Terminal-Bench integrity guard blocked benchmark-owned or solution material.";
  }
  return undefined;
}

function recordDenial(tool: string, callId: string, reason: string, env: BenchmarkEnv): void {
  const auditPath = env.INDUSAGI_BENCHMARK_AUDIT_LOG ?? "/logs/agent/integrity-denials.jsonl";
  try {
    appendFileSync(auditPath, `${JSON.stringify({ type: "integrity_denial", tool, call_id: callId, reason })}\n`, { encoding: "utf8" });
  } catch {
    // Blocking must remain fail-closed even if the optional audit sink is unavailable.
  }
}

function wrapOne(tool: AgentTool, cwd: string, env: BenchmarkEnv): AgentTool {
  const execute = tool.execute.bind(tool);
  return {
    ...tool,
    async execute(callId: string, args: unknown, signal?: AbortSignal, onUpdate?: unknown) {
      const reason = denialReason(tool.name, args, cwd);
      if (reason !== undefined) {
        recordDenial(tool.name, callId, reason, env);
        return {
          content: [{ type: "text" as const, text: reason }],
          details: undefined,
          isError: true,
        };
      }
      return execute(callId, args as never, signal as never, onUpdate as never);
    },
  };
}

/** Apply fail-closed Terminal-Bench integrity checks at every enabled tool boundary. */
export function wrapToolsForTerminalBench(tools: AgentTool[], cwd: string, env: BenchmarkEnv = process.env): AgentTool[] {
  if (env.INDUSAGI_BENCHMARK_PROFILE !== "terminal-bench") return tools;
  return tools.map((tool) => GUARDED_TOOLS.has(tool.name) ? wrapOne(tool, cwd, env) : tool);
}
