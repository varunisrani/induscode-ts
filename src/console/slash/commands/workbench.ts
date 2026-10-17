/**
 * Workbench slash commands (model pickers, settings, help, keys, changelog, debug, plan, thinking).
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SlashCommand } from "../../contract.js";
import { SLASH_COMMANDS } from "../builtins.js";
import { FAMILY, HANDLED, familyRunner, info, warn } from "./shared.js";

function block(slug: string, title: string, markdown: string) {
  return {
    id: `${slug}-${Date.now().toString(36)}`,
    kind: "changelog" as const,
    title,
    markdown,
    timestamp: Date.now()
  };
}

async function helpBlock() {
  const lines = SLASH_COMMANDS.map((c) => {
    const alts = c.aliases && c.aliases.length > 0 ? ` _(/${c.aliases.join(", /")})_` : "";
    return `- **/${c.name}**${alts} — ${c.summary}`;
  });
  const body = [
    `${SLASH_COMMANDS.length} commands available. Type \`/\` to complete.`,
    "",
    ...lines
  ].join("\n");
  return block("help", "Commands", body);
}

function hotkeysBlock() {
  const rows = HOTKEYS.map(([chord, effect]) => `| \`${chord}\` | ${effect} |`);
  const body = [
    "| Shortcut | Action |",
    "| --- | --- |",
    ...rows
  ].join("\n");
  return block("hotkeys", "Keyboard shortcuts", body);
}

function readChangelog(cwd: string) {
  for (const name of CHANGELOG_NAMES) {
    try {
      const text = readFileSync(join(cwd, name), "utf8");
      if (text.trim().length > 0) return text;
    } catch {
      // ignore
    }
  }
  return null;
}

function runChangelog(ctx: any) {
  const markdown = readChangelog(process.cwd());
  ctx.appendBlock(
    markdown !== null
      ? block("changelog", "Changelog", markdown)
      : block("changelog", "What's new", CHANGELOG_FALLBACK)
  );
  return HANDLED;
}

function runDebug(ctx: any) {
  ctx.dispatch({ type: "toggle:reasoning" });
  const stats = ctx.conductor.stats();
  const messages = ctx.conductor.messages();
  const snapshot = ctx.conductor.snapshot();
  const records: any[] = [
    {
      type: "session",
      at: new Date().toISOString(),
      sessionId: stats.sessionId,
      modelId: snapshot.modelId,
      phase: snapshot.phase,
      stats
    },
    ...messages.map((message: any, index: number) => ({
      type: "message",
      index,
      role: message.role ?? "unknown",
      content: message.content
    }))
  ];
  const jsonl = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
  try {
    const dir = mkdtempSync(join(tmpdir(), "indus-debug-"));
    const path = join(dir, `session-${stats.sessionId || "unknown"}.jsonl`);
    writeFileSync(path, jsonl, "utf8");
    ctx.setStatus(info(`Diagnostics written to ${path}`));
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    ctx.setStatus(warn(`Could not write the diagnostics log (${detail}).`));
  }
  return HANDLED;
}

function runPlan(ctx: any) {
  const wasPlan = ctx.conductor.permissionMode() === "plan";
  const now = ctx.conductor.togglePlanMode(!wasPlan);
  ctx.setStatus(
    now === "plan"
      ? info("Plan mode ON — read-only research; mutating tools are blocked. Run /plan again to leave.")
      : info(`Plan mode OFF — permission mode is now ${now}.`)
  );
  return HANDLED;
}

const SCOPED_MODEL_VERBS = [
  {
    verb: "edit",
    describe: "open the per-scope routing editor",
    run: (ctx: any) => {
      ctx.openModal("scopedModels");
      return HANDLED;
    }
  },
  {
    verb: "show",
    describe: "review the active per-scope assignments",
    run: (ctx: any) => {
      ctx.openModal("scopedModels", { focus: "summary" });
      return HANDLED;
    }
  },
  {
    verb: "reset",
    describe: "clear every per-scope override",
    run: (ctx: any) => {
      ctx.openModal("scopedModels", { intent: "reset" });
      ctx.setStatus(info("Per-scope model overrides cleared."));
      return HANDLED;
    }
  }
];

const runScopedModels = familyRunner(FAMILY.scopedModels, SCOPED_MODEL_VERBS);

const HOTKEYS: Array<[string, string]> = [
  ["Enter", "Submit the current turn"],
  ["Shift+Enter", "Insert a soft newline in the composer"],
  ["Esc", "Dismiss an overlay / abort the in-flight turn"],
  ["Esc Esc", "Open the transcript-tree navigator"],
  ["Shift+Tab", "Cycle permission mode (default → accept-edits → plan → bypass)"],
  ["Tab", "Accept the highlighted completion"],
  ["Ctrl+C", "Interrupt the running turn"],
  ["Ctrl+T", "Toggle reasoning / thinking rows"],
  ["/thinking", "Cycle the selected model's supported reasoning efforts"],
  ["Ctrl+V", "Attach an image from the clipboard"],
  ["Ctrl+G", "Edit the composer in your external editor"],
  ["Ctrl+O", "Expand or collapse full tool output"],
  ["Ctrl+L", "Open the model picker"],
  ["Ctrl+R", "Open the session resume list"],
  ["Ctrl+N / Ctrl+P", "Cycle the active model"],
  ["Ctrl+A / Ctrl+E", "Jump to start / end of the line"],
  ["Ctrl+U", "Clear the composer line (twice: exit)"],
  ["Ctrl+J", "Insert a newline"],
  ["Ctrl+Z", "Suspend the process"],
  ["Alt+Up", "Pull the newest queued input back into the composer"],
  ["Ctrl+X", "Run the newest queued message NOW (stops the current run)"],
  ["! <cmd>", "Run a shell command (kept in context)"],
  ["!! <cmd>", "Run a shell command (excluded from context)"]
];

const CHANGELOG_NAMES = ["CHANGELOG.md", "CHANGELOG", "changelog.md"];

const CHANGELOG_FALLBACK = [
  "No `CHANGELOG.md` was found at the workspace root.",
  "",
  "Recent highlights in this build:",
  "- Model and per-scope routing pickers reachable from the composer.",
  "- `/help` and `/keys` render live command and shortcut references.",
  "- Colour scheme switches inline between **saffron**, **midnight**, and **daylight**."
].join("\n");

export const workbenchCommands: SlashCommand[] = [
  {
    name: "model",
    summary: "Switch the model bound to this session",
    aliases: ["models"],
    run: (ctx) => {
      ctx.openModal("models");
      return HANDLED;
    }
  },
  {
    name: "models-for",
    summary: "Edit, show, or reset per-scope model routing",
    aliases: ["scoped-models"],
    family: FAMILY.scopedModels,
    takesArgs: true,
    run: runScopedModels
  },
  {
    name: "settings",
    summary: "Open the settings overlay",
    run: (ctx) => {
      ctx.openModal("settings");
      return HANDLED;
    }
  },
  {
    name: "help",
    summary: "List the available commands",
    aliases: ["?"],
    run: async (ctx) => {
      ctx.appendBlock(await helpBlock());
      return HANDLED;
    }
  },
  {
    name: "keys",
    summary: "Show the keyboard shortcut map",
    aliases: ["hotkeys"],
    run: (ctx) => {
      ctx.appendBlock(hotkeysBlock());
      return HANDLED;
    }
  },
  {
    name: "whats-new",
    summary: "Show what changed in this build",
    aliases: ["changelog", "release-notes"],
    run: runChangelog
  },
  {
    name: "plan",
    summary: "Toggle plan mode (read-only research; mutating tools are blocked)",
    run: runPlan
  },
  {
    name: "thinking",
    summary: "Cycle reasoning effort using the selected model's supported levels",
    run: (ctx) => {
      ctx.conductor.cycleThinkingLevel();
      return HANDLED;
    }
  },
  {
    name: "debug",
    summary: "Write a session diagnostics log and toggle verbose view",
    run: runDebug
  }
];