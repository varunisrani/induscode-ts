// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Runners subsystem — public barrel.
 *
 * Surfaces the runner registry and the individual placeholder runners. Boot
 * consumers dispatch through {@link selectRunner} / {@link RUNNERS}; the named
 * runners are exported for tests and for explicit wiring.
 */
export { replRunner } from "./repl-runner";
export { oneshotRunner } from "./oneshot-runner";
export { linkRunner } from "./link-runner";
export { RUNNERS, selectRunner } from "./registry";
export { createReadStateStore, READ_STATE_HANDLE_KEY, ReadStateStore, } from "./read-state";
export { createCheckpointStore, CHECKPOINT_HANDLE_KEY, CheckpointStore, } from "./checkpoint";
