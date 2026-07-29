/**
 * Boot orchestrator — the single function the OS entry point calls.
 *
 * {@link boot} owns the whole launch arc: it assembles the seed
 * {@link BootContext} (resolved workspace + brand + a placeholder invocation),
 * runs the ordered {@link runStages | stage pipeline} to resolve the rest
 * (parse the command line, materialise directories, apply upgrades, build the
 * startup-resource graph), handles the meta requests (`--help` / `--version`)
 * that short-circuit before any runner, then dispatches to the
 * {@link selectRunner | selected runner} and returns its exit code.
 *
 * Cleanup is guaranteed: every teardown callback accumulated in
 * {@link BootContext.closables} is drained in a `finally`, latest-registered
 * first, regardless of how the runner resolved. {@link boot} itself never throws
 * to its caller for an expected failure — it maps problems to a non-zero exit
 * code so the entry point can simply set `process.exitCode`.
 */
import { BRAND, VERSION } from "../workspace/brand.js";
import { formatCredentialFault, runCredentialCommand } from "../launch/credentials.js";
import { runPackageCommand } from "../launch/packages.js";
import { wantsHelp, wantsVersion } from "./invocation.js";
import { printModelCatalog } from "../launch/catalog.js";
import { renderUsage } from "../launch/invocation/usage.js";
import type { BootContext } from "./contract.js";
import { runStages } from "./stages.js";
import { selectRunner } from "./runners/registry.js";
import { createAuthVault } from "./auth-vault.js";
import { runLogin } from "../launch/login.js";
import { createWorkspace } from "../workspace/locator.js";
import { PreferenceStore } from "../settings/manager.js";
import { tokenizeInvocation } from "./invocation.js";

const EXIT_OK = 0;
const EXIT_FAILURE = 1;
const EXIT_CREDENTIAL_FAULT = 1;

function seedContext(argv: string[]): BootContext {
  const workspace = createWorkspace();
  const invocation = tokenizeInvocation(argv);
  return {
    argv,
    workspace,
    brand: BRAND,
    invocation,
    closables: [],
  };
}

function renderHelp(): void {
  process.stdout.write(`${renderUsage()}\n`);
}

function renderVersion(): void {
  process.stdout.write(`${BRAND.name} ${VERSION}\n`);
}

async function drainClosables(ctx: BootContext): Promise<void> {
  for (const close of [...ctx.closables].reverse()) {
    try {
      await close();
    } catch {
      // ignore teardown errors
    }
  }
}

async function runCredential(ctx: BootContext): Promise<number | undefined> {
  const result = await runCredentialCommand(ctx.argv, {
    vault: createAuthVault(ctx.workspace.authPath),
    profileDir: ctx.workspace.profileDir,
  });
  if (!result.handled) {
    return undefined;
  }
  if (result.fault !== undefined) {
    process.stderr.write(`${formatCredentialFault(result.fault)}\n`);
    return EXIT_CREDENTIAL_FAULT;
  }
  return EXIT_OK;
}

async function runPackage(ctx: BootContext): Promise<number | undefined> {
  const result = await runPackageCommand(ctx.argv, {
    store: PreferenceStore.fromWorkspace(ctx.workspace, ctx.invocation.cwd),
  });
  if (!result.handled) {
    return undefined;
  }
  return result.code ?? EXIT_OK;
}

/**
 * Boot the agent: resolve everything, dispatch to the chosen runner, and return
 * the process exit code.
 *
 * @param argv The arguments the launch was invoked with, already sliced (no
 *   node/exec path).
 * @returns The exit code the process should adopt.
 */
export async function boot(argv: string[]): Promise<number> {
  const seeded = seedContext(argv);
  const credential = await runCredential(seeded);
  if (credential !== undefined) {
    return credential;
  }
  const login = await runLogin(seeded);
  if (login !== undefined) {
    return login;
  }
  const pkg = await runPackage(seeded);
  if (pkg !== undefined) {
    return pkg;
  }
  if (wantsHelp(seeded.invocation)) {
    renderHelp();
    return EXIT_OK;
  }
  if (wantsVersion(seeded.invocation)) {
    renderVersion();
    return EXIT_OK;
  }
  if (seeded.invocation.listModels) {
    const filter = seeded.invocation.listModelsFilter;
    printModelCatalog(undefined, filter !== undefined ? { search: filter } : {});
    return EXIT_OK;
  }
  const ctx = await runStages(seeded);
  try {
    const runner = selectRunner(ctx.invocation);
    return await runner.run(ctx);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${BRAND.name}: ${message}\n`);
    return EXIT_FAILURE;
  } finally {
    await drainClosables(ctx);
  }
}
