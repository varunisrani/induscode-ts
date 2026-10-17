/**
 * The single declarative flag table.
 *
 * Every recognised command-line option is described here exactly once, as one
 * {@link FlagSpec} row.
 */
import type { FlagSpec } from "../contract.js";

export type FlagGroup = "output" | "model" | "context" | "tools" | "meta";

export interface GroupedFlagSpec extends FlagSpec {
  readonly group: FlagGroup;
}

export const FLAG_GROUPS: readonly { readonly id: FlagGroup; readonly title: string }[] = [
  { id: "output", title: "Output" },
  { id: "model", title: "Model" },
  { id: "context", title: "Context" },
  { id: "tools", title: "Tools" },
  { id: "meta", title: "Meta" },
];

const THINKING_CHOICES = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];

export const FLAG_SPECS: readonly GroupedFlagSpec[] = [
  /* ---- Output ---------------------------------------------------------- */
  {
    name: "--print",
    aliases: ["-p"],
    kind: "boolean",
    group: "output",
    describe: "Run a single request, print only the result, and exit.",
  },
  {
    name: "--json",
    aliases: ["--rpc"],
    kind: "boolean",
    group: "output",
    describe: "Speak the headless line protocol for a driving parent process.",
  },
  {
    name: "--interactive",
    aliases: ["-i"],
    kind: "boolean",
    group: "output",
    describe: "Force the interactive session even when a prompt is supplied.",
  },
  /* ---- Model ----------------------------------------------------------- */
  {
    name: "--model",
    aliases: ["-m"],
    kind: "string",
    group: "model",
    describe: "Select the model, provider-qualified or bare (e.g. provider/name).",
  },
  {
    name: "--fallback-model",
    kind: "string",
    group: "model",
    describe: "Model to switch to mid-turn when the selected model is overloaded (HTTP 529).",
  },
  {
    name: "--account",
    kind: "string",
    group: "model",
    describe: "Authenticate the run with a named stored credential account.",
  },
  {
    name: "--thinking",
    kind: "string",
    group: "model",
    describe: `Set the reasoning effort (one of: ${THINKING_CHOICES.join(", ")}).`,
  },
  {
    name: "--list-models",
    kind: "string",
    group: "model",
    describe: "List the available models (optionally filtered by a substring) and exit.",
  },
  /* ---- Context --------------------------------------------------------- */
  {
    name: "--cwd",
    kind: "string",
    group: "context",
    describe: "Scope the run to a working directory (default: the current directory).",
  },
  {
    name: "--system",
    kind: "string",
    group: "context",
    describe: "Replace the built-in system prompt with the given text.",
  },
  {
    name: "--append-system",
    kind: "string",
    group: "context",
    describe: "Append extra text after the system prompt.",
  },
  {
    name: "--resume",
    aliases: ["-r"],
    kind: "boolean",
    group: "context",
    describe: "Pick a previous session to resume.",
  },
  {
    name: "--continue",
    aliases: ["-c"],
    kind: "boolean",
    group: "context",
    describe: "Continue the most recent session in this directory.",
  },
  {
    name: "--trust-project-addons",
    kind: "boolean",
    group: "context",
    describe: "Trust executable project addons for the canonical workspace and their current content digest.",
  },
  {
    name: "--allow-context-import",
    kind: "list",
    group: "context",
    describe: "Explicitly approve an exact external context file (comma-separated or repeated). Secret-like files remain blocked.",
  },
  /* ---- Tools ----------------------------------------------------------- */
  {
    name: "--tools",
    kind: "list",
    group: "tools",
    describe: "Allow only the named built-in tools (comma-separated or repeated).",
  },
  {
    name: "--no-tools",
    kind: "boolean",
    group: "tools",
    describe: "Disable every built-in tool for this run.",
  },
  {
    name: "--mcp",
    kind: "list",
    group: "tools",
    describe: "Attach an external MCP server endpoint (comma-separated or repeated).",
  },
  {
    name: "--zoho-url",
    kind: "string",
    group: "tools",
    describe: "Zoho MCP server URL (from Zoho Connect tab). Enables native Zoho CRM tools.",
  },
  {
    name: "--zoho",
    kind: "boolean",
    group: "tools",
    describe: "Force-enable Zoho tools when ZOHO_MCP_URL or zoho.json is configured.",
  },
  {
    name: "--no-zoho",
    kind: "boolean",
    group: "tools",
    describe: "Disable Zoho MCP tools for this run.",
  },
  {
    name: "--sarvam",
    kind: "boolean",
    group: "tools",
    describe: "Force-enable Sarvam MCP tools when SARVAM_API_KEY is configured.",
  },
  {
    name: "--no-sarvam",
    kind: "boolean",
    group: "tools",
    describe: "Disable Sarvam MCP tools for this run.",
  },
  {
    name: "--sarvam-key",
    kind: "string",
    group: "tools",
    describe: "Sarvam API key for this run (prefer SARVAM_API_KEY env).",
  },
  {
    name: "--sarvam-base-path",
    kind: "string",
    group: "tools",
    describe: "Directory for Sarvam TTS/docs output (default ~/Desktop).",
  },
  {
    name: "--permission-mode",
    kind: "string",
    group: "tools",
    describe:
      "Open in the given permission mode: default, acceptEdits, plan, or bypass. On headless runs (--print/--json) `default` denies tools that would prompt.",
  },
  /* ---- Meta ------------------------------------------------------------ */
  {
    name: "--help",
    aliases: ["-h"],
    kind: "boolean",
    group: "meta",
    describe: "Show this usage and exit.",
  },
  {
    name: "--version",
    aliases: ["-v"],
    kind: "boolean",
    group: "meta",
    describe: "Show the version and exit.",
  },
];