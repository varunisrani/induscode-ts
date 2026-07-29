/**
 * Runner: `repl` — interactive terminal session.
 *
 * Mounts the Phase-7 console for a live session: it assembles a
 * {@link SessionConductor} for the invocation and renders the interactive surface
 * via {@link mountConsole}, seeding it with the positional prompt when one was
 * supplied. The runner resolves the success exit code once the surface is
 * dismissed.
 */
import { mountConsole } from "../../console/index.js";
import { listLoginProviders, openLoginUrl, startOAuthLogin } from "../../launch/oauth.js";
import { pickResumeTarget } from "../../launch/pickers.js";
import { SessionLibrary } from "../../sessions/library.js";
import { PreferenceStore } from "../../settings/manager.js";
import { sessionScopeDir } from "./session.js";
import { createAuthVault } from "../auth-vault.js";
import type { BootContext, Runner } from "../contract.js";
import { buildSessionConductor } from "./session.js";
import { resolveServerGatewayUrls } from "./server-mode.js";

const EXIT_OK = 0;

/**
 * Build the in-memory overlay services the interactive console expects.
 *
 * The console calls a few helpers directly (`listLoginProviders`,
 * `startOAuthLogin`, vault access, gateway re-routing). All of those are
 * wired here from the boot-layer pieces so the conductor and the UI share one
 * credential store and one gateway-base-url mapping.
 */
export function buildOverlayServices(ctx: BootContext, conductor: { updateGatewayBaseUrls(map: Record<string, string>): void }) {
  const cwd = ctx.invocation.cwd ?? process.cwd();
  const vault = createAuthVault(ctx.workspace.authPath);
  return {
    conductor,
    settings: PreferenceStore.fromWorkspace(ctx.workspace, cwd),
    sessions: new SessionLibrary({
      sessionsDir: sessionScopeDir(ctx.workspace.sessionsDir, ctx.invocation.cwd ?? process.cwd()),
    }),
    listLoginProviders,
    startOAuthLogin,
    openLoginUrl,
    vault,
    async refreshGatewayRouting() {
      const map = await resolveServerGatewayUrls(ctx, vault);
      conductor.updateGatewayBaseUrls(map);
    },
  };
}

function toResumeRef(row: { id: string; path: string; lastModified?: number; messageCount?: number; preview?: string; name?: string; size?: number }) {
  const lastModified = row.lastModified ?? 0;
  return {
    id: row.id,
    path: row.path,
    cwd: "",
    lastModified,
    created: new Date(lastModified),
    modified: new Date(lastModified),
    messageCount: row.messageCount ?? 0,
    firstMessage: row.preview ?? "",
    allMessagesText: row.preview ?? "",
    ...row.name !== undefined ? { name: row.name } : {},
    ...row.size !== undefined ? { size: row.size } : {},
  };
}

async function chooseResumeTarget(ctx: BootContext, library: SessionLibrary): Promise<string | null> {
  const inv = ctx.invocation;
  if (inv.continueLatest === true) {
    const rows = await library.list();
    return rows.length > 0 ? rows[0].id : null;
  }
  const rows = await library.list();
  if (rows.length === 0) return null;
  const refs = rows.map(toResumeRef);
  const idByPath = new Map(rows.map((row) => [row.path, row.id]));
  const load = async () => refs;
  const outcome = await pickResumeTarget(load, load);
  if (outcome.fault !== undefined) {
    throw outcome.fault.cause ?? new Error(outcome.fault.message);
  }
  if (outcome.path === null) return null;
  return idByPath.get(outcome.path) ?? null;
}

/**
 * Apply `--resume` / `--continue` to a freshly-built conductor.
 *
 * Tolerates a missing resume target by logging and starting a fresh session;
 * tolerance preserves the interactive boot flow when the prior session was
 * deleted between launches.
 */
export async function applyResume(ctx: BootContext, conductor: { resume(id: string): Promise<void>; snapshot(): { phase: string } }): Promise<void> {
  const inv = ctx.invocation;
  if (inv.resume !== true && inv.continueLatest !== true) return;
  const library = new SessionLibrary({
    sessionsDir: sessionScopeDir(ctx.workspace.sessionsDir, ctx.invocation.cwd ?? process.cwd()),
  });
  try {
    const sessionId = await chooseResumeTarget(ctx, library);
    if (sessionId === null) {
      process.stderr.write("No prior session to resume; starting a fresh one.\n");
      return;
    }
    await conductor.resume(sessionId);
    const state = conductor.snapshot();
    if (state.phase === "faulted") {
      process.stderr.write(
        `Could not resume session "${sessionId}"; starting a fresh one.\n`,
      );
    }
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    process.stderr.write(`Resume failed (${detail}); starting a fresh session.\n`);
  }
}

/**
 * The interactive-REPL runner.
 *
 * {@link Runner.accepts} matches invocations whose resolved mode is `repl`; it is
 * also the registry default, so it is reached for the empty / interactive command
 * line. {@link Runner.run} assembles the conductor, honours `--resume` /
 * `--continue`, and mounts the console.
 */
export const replRunner: Runner = {
  id: "repl",
  accepts(inv) {
    return inv.mode === "repl";
  },
  async run(ctx) {
    const conductor = await buildSessionConductor(ctx);
    await applyResume(ctx, conductor);
    const services = buildOverlayServices(ctx, conductor);
    const initialInput = ctx.invocation.prompt;
    await mountConsole(
      conductor,
      initialInput === undefined ? { services } : { initialInput, services },
    );
    return EXIT_OK;
  },
};
