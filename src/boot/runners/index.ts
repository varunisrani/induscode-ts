/**
 * Runners subsystem — public barrel.
 *
 * Surfaces the runner registry and the individual placeholder runners. Boot
 * consumers dispatch through {@link selectRunner} / {@link RUNNERS}; the named
 * runners are exported for tests and for explicit wiring.
 */
export { replRunner } from "./repl-runner.js";
export { oneshotRunner } from "./oneshot-runner.js";
export { linkRunner } from "./link-runner.js";
export { RUNNERS, selectRunner } from "./registry.js";
export { createReadStateStore, READ_STATE_HANDLE_KEY, ReadStateStore } from "./read-state.js";
export { createCheckpointStore, CHECKPOINT_HANDLE_KEY, CheckpointStore } from "./checkpoint.js";
