// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Heap headroom guard.
 *
 * Node's default old-space cap (~2 GB on 64-bit builds) is too small for heavy
 * runs — most acutely a burst of parallel sub-agents whose combined transcripts
 * push the resident heap past the default and abort the whole process with a V8
 * "JavaScript heap out of memory" fatal (the exact crash this guards against).
 *
 * `--max-old-space-size` can only be set at process launch, so before any real
 * work begins we re-exec the *same* program once with a raised cap, inherit its
 * stdio (so the interactive TUI runs unchanged in the child), and adopt its exit
 * code. The re-exec is one level deep: the child carries `INDUS_HEAP_BOOSTED=1`
 * so it skips the guard and runs the agent directly.
 *
 * Controlled by env:
 *   INDUS_MAX_HEAP_MB   target old-space size in MB (default 4096; 0 disables
 *                       the guard entirely and runs in-process).
 *   INDUS_HEAP_BOOSTED  set internally on the child; never set this yourself.
 *
 * If the re-exec cannot spawn (a locked-down sandbox, a missing argv[1]) the
 * guard silently falls back to running in the current, un-boosted process rather
 * than failing to start.
 */
/**
 * Ensure the process has heap headroom, re-execing once if it does not.
 *
 * Returns normally in three cases: the guard is disabled, the cap is already
 * raised, or the re-exec could not be spawned. Otherwise it does NOT return —
 * it runs the boosted child to completion and exits with the child's status.
 */
export declare function ensureHeapHeadroom(): void;
