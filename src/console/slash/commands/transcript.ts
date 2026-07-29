/**
 * Slash commands that operate on the session transcript (clear/new, compact, resume, stats, name, reload, quit).
 */
import type { SlashCommand } from "../../contract.js";
import { HANDLED, info, warn } from "./shared.js";

function wipeView(ctx: { dispatch: (e: any) => void; setStatus: (s: any) => void }) {
  ctx.dispatch({ type: "rows:set", rows: [] });
  ctx.dispatch({ type: "blocks:clear" });
  ctx.dispatch({ type: "status:clear" });
}

function startNewSession(ctx: any, toast: string) {
  wipeView(ctx);
  ctx.setStatus(info(toast));
  void ctx.conductor.newSession().catch(() => {
    ctx.setStatus(warn("Could not start a new session."));
  });
  return HANDLED;
}

function statsMarkdown(stats: any, name: string | undefined): string {
  const dollars = `$${stats.cost.toFixed(4)}`;
  const t = stats.tokens;
  const rows: Array<[string, string]> = [
    ["Session", name ? `${name} (${stats.sessionId})` : stats.sessionId],
    ["Messages", String(stats.totalMessages)],
    ["User / assistant", `${stats.userMessages} / ${stats.assistantMessages}`],
    ["Tool calls / results", `${stats.toolCalls} / ${stats.toolResults}`],
    ["Tokens (in / out)", `${t.input} / ${t.output}`],
    ["Tokens (cache r/w)", `${t.cacheRead} / ${t.cacheWrite}`],
    ["Tokens (total)", String(t.total)],
    ["Cost", dollars]
  ];
  const body = rows.map(([k, v]) => `| ${k} | ${v} |`).join("\n");
  return `| Field | Value |
| --- | --- |
${body}`;
}

const clearCommand: SlashCommand = {
  name: "clear",
  summary: "Clear the conversation and start a new session",
  aliases: ["reset"],
  run(ctx) {
    return startNewSession(ctx, "Started a new session.");
  }
};

const newCommand: SlashCommand = {
  name: "new",
  summary: "Start a fresh session",
  run(ctx) {
    return startNewSession(ctx, "Started a new session.");
  }
};

const compactCommand: SlashCommand = {
  name: "compact",
  summary: "Condense the conversation context",
  aliases: ["condense", "summarize-context"],
  takesArgs: true,
  run(ctx) {
    const instructions = ctx.args.trim();
    const busyText =
      instructions.length > 0
        ? `Compacting with guidance: ${instructions} — Esc to cancel`
        : "Compacting conversation context... Press Esc to cancel.";
    ctx.setStatus({ kind: "busy", text: busyText });
    void (async () => {
      try {
        if (instructions.length > 0) {
          await ctx.conductor.executeBash(
            `printf '%s' ${JSON.stringify(`Compaction guidance: ${instructions}`)}`
          );
        }
        switch (await ctx.conductor.condense()) {
          case "condensed":
            ctx.setStatus(
              info(
                instructions.length > 0
                  ? "Context condensed (guidance recorded for the agent)."
                  : "Context condensed."
              )
            );
            break;
          case "nothing":
            ctx.setStatus(warn("Nothing to compact yet."));
            break;
          case "cancelled":
            ctx.setStatus(warn("Compaction cancelled."));
            break;
          case "busy":
            ctx.setStatus(warn("A turn is running — press Esc to stop it first, then /compact."));
            break;
          case "failed":
            ctx.setStatus(warn("Compaction failed; the transcript is unchanged."));
            break;
        }
      } catch {
        ctx.setStatus(warn("Compaction failed; the transcript is unchanged."));
      }
    })();
    return HANDLED;
  }
};

const resumeCommand: SlashCommand = {
  name: "resume",
  summary: "Resume a persisted session",
  aliases: ["sessions"],
  run(ctx) {
    ctx.openModal("sessions");
    return HANDLED;
  }
};

const sessionCommand: SlashCommand = {
  name: "session",
  summary: "Show live session statistics (ids, counts, tokens, cost)",
  run(ctx) {
    const stats = ctx.conductor.stats();
    const name = ctx.conductor.sessionName();
    const block = {
      id: `session-stats-${Date.now().toString(36)}`,
      kind: "changelog",
      title: name ? `Session: ${name}` : "Session statistics",
      markdown: statsMarkdown(stats, name),
      timestamp: Date.now()
    };
    ctx.appendBlock(block);
    ctx.setStatus(
      info(
        `${stats.totalMessages} messages, ${stats.tokens.total} tokens, $${stats.cost.toFixed(4)}.`
      )
    );
    return HANDLED;
  }
};

const costCommand: SlashCommand = {
  name: "cost",
  summary: "Show session cost and token usage",
  run(ctx) {
    const stats = ctx.conductor.stats();
    const t = stats.tokens;
    const rows: Array<[string, string]> = [
      ["Total cost", `$${stats.cost.toFixed(4)}`],
      ["Total tokens", String(t.total)],
      ["Input / output", `${t.input} / ${t.output}`],
      ["Cache read / write", `${t.cacheRead} / ${t.cacheWrite}`]
    ];
    const markdown = `| Field | Value |
| --- | --- |
${rows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}`;
    const block = {
      id: `session-cost-${Date.now().toString(36)}`,
      kind: "changelog",
      title: "Session cost",
      markdown,
      timestamp: Date.now()
    };
    ctx.appendBlock(block);
    ctx.setStatus(info(`$${stats.cost.toFixed(4)} · ${t.total} tokens`));
    return HANDLED;
  }
};

const forkCommand: SlashCommand = {
  name: "branch",
  summary: "Branch the transcript from a prior turn",
  aliases: ["fork"],
  run(ctx) {
    ctx.openModal("userTurns");
    return HANDLED;
  }
};

const treeCommand: SlashCommand = {
  name: "timeline",
  summary: "Navigate the transcript tree",
  aliases: ["tree"],
  run(ctx) {
    ctx.openModal("tree");
    return HANDLED;
  }
};

const nameCommand: SlashCommand = {
  name: "name",
  summary: "Name the session, or show the current name",
  takesArgs: true,
  run(ctx) {
    const label = ctx.args.trim();
    if (label.length === 0) {
      const current = ctx.conductor.sessionName();
      ctx.setStatus(
        current === void 0 || current.length === 0
          ? info("This session has no name. Set one with /name <label>.")
          : info(`Current session name: ${current}`)
      );
      return HANDLED;
    }
    ctx.conductor.setSessionName(label);
    ctx.setStatus(info(`Session named "${label}".`));
    return HANDLED;
  }
};

const reloadCommand: SlashCommand = {
  name: "reload",
  summary: "Reload session resources",
  run(ctx) {
    const leaf = ctx.conductor.snapshot().head.leaf;
    if (leaf === null) {
      ctx.setStatus(info("Session is empty; nothing to reload."));
      return HANDLED;
    }
    ctx.setStatus({ kind: "busy", text: "Reloading session resources..." });
    void (async () => {
      try {
        await ctx.conductor.navigateTree(leaf);
        ctx.setStatus(info("Reloaded session resources."));
      } catch {
        ctx.setStatus(warn("Could not reload session resources."));
      }
    })();
    return HANDLED;
  }
};

const quitCommand: SlashCommand = {
  name: "quit",
  summary: "Leave the interactive console",
  run(ctx) {
    ctx.requestExit();
    return HANDLED;
  }
};

const exitCommand: SlashCommand = {
  name: "exit",
  summary: "Leave the interactive console",
  run(ctx) {
    ctx.requestExit();
    return HANDLED;
  }
};

export const transcriptCommands: SlashCommand[] = [
  clearCommand,
  newCommand,
  compactCommand,
  resumeCommand,
  sessionCommand,
  costCommand,
  forkCommand,
  treeCommand,
  nameCommand,
  reloadCommand,
  quitCommand,
  exitCommand
];