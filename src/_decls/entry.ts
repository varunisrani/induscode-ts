// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Process entry point — the bin the OS launches.
 *
 * Responsibilities, in order:
 *   1. Set `process.title` to the brand's primary bin name so the process is
 *      identifiable in `ps` / activity monitors.
 *   2. Install exactly one console filter that suppresses the transport-layer
 *      `[MCP]` noise the MCP stack emits on stdout/stderr (unless the brand's
 *      debug env var is set, in which case nothing is filtered).
 *   3. Hand the sliced `argv` to {@link boot} and adopt its resolved exit code.
 *
 * The boot call is guarded by an `import.meta` entry check so importing this
 * module (e.g. from a test) does not launch the agent — only running it as the
 * program entry does.
 */
export {};
