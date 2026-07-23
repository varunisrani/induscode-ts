// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
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
/**
 * Boot the agent: resolve everything, dispatch to the chosen runner, and return
 * the process exit code.
 *
 * @param argv The arguments the launch was invoked with, already sliced (no
 *   node/exec path).
 * @returns The exit code the process should adopt.
 */
export declare function boot(argv: string[]): Promise<number>;
