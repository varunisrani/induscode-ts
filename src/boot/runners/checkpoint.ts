// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Per-session file-checkpoint store — the product half of rewind (#24).
 *
 * The framework's mutating file tools (write/edit) consult a host-injected handle
 * on `ctx.framework` under the string-literal key {@link CHECKPOINT_HANDLE_KEY}.
 * Immediately before a file is written — and after the read-before-edit gate has
 * passed — the framework reads the file's CURRENT on-disk content and hands it to
 * the handle as `record(absPath, previous)`, where `previous` is the old bytes or
 * `null` when the file did not yet exist. This module supplies the missing host
 * piece: a store that files those pre-mutation snapshots against the transcript
 * node that was active when the mutation happened, so a later rewind to that node
 * can roll the working tree back to exactly that point.
 *
 * Design notes:
 *   - **Keyed by the ACTIVE transcript node id.** Each snapshot is filed under the
 *     id the conductor pins as the active node (the head leaf at turn start). All
 *     of a turn's edits therefore land under ONE node id; navigating back to that
 *     node and restoring reverts the whole turn's file changes at once.
 *   - **First-seen wins per path within a node.** If the same file is edited twice
 *     in one turn, only the FIRST snapshot (the content as it was when the node
 *     became active) is kept. Overwriting it would lose the true pre-turn state,
 *     so a second `record` of the same path under the same node is ignored. This
 *     also makes the framework's pre-write `record` idempotent across the multiple
 *     mutations one tool call may perform.
 *   - **`null` previous means "file was absent".** Restoring a node whose snapshot
 *     marks a file `null` DELETES that file (it did not exist at that point), so a
 *     rewind that created a file is undone by removing it.
 *   - **Duck-typed handle.** The store implements exactly the framework's
 *     `CheckpointHandle` shape (`record(absPath, previous: string | null): void`)
 *     so the host injector and the framework consumer agree by STRING KEY and
 *     STRUCTURAL SHAPE — no cross-package type import. `ctx.framework` is an open
 *     record, so the injection typechecks immediately; the framework consumption
 *     activates after the framework is rebuilt and the product refreshed.
 *   - **One instance PER SESSION** (minted in `session.ts`), shared across the
 *     write/edit cards through the single `ctx.framework` bag, and handed to the
 *     conductor so the conductor can advance the active node id as the head moves.
 *
 * Mirrors the read-edit-gate's `ReadStateStore` conventions (`READ_STATE_HANDLE_KEY`,
 * `createReadStateStore`); both coexist in the SAME `ctx.framework` open bag.
 */
/**
 * The string-literal key under which the host wires this store onto the deck's
 * `ctx.framework` bag.
 *
 * Mirrors the existing `DELEGATE_HANDLE_KEY = "delegate"`,
 * `MEMORY_HANDLE_KEY = "memoryStore"`, and `READ_STATE_HANDLE_KEY = "readState"`
 * conventions. The framework's mutating file tools read
 * `ctx.framework["checkpoint"]` by the same literal, so the two sides agree by
 * string rather than by a shared imported symbol.
 */
export declare const CHECKPOINT_HANDLE_KEY: "checkpoint";
/**
 * One file's pre-mutation snapshot: the path that was mutated and the content it
 * held immediately before. `previous === null` records that the file did not
 * exist on disk before the mutation, so restoring this snapshot deletes it.
 */
export interface FileSnapshot {
    readonly path: string;
    readonly previous: string | null;
}
/**
 * Per-session file-checkpoint store, keyed by transcript node id.
 *
 * For each node id it holds a map of normalized absolute path → the FIRST-seen
 * pre-mutation content for that path under that node. The framework calls
 * {@link record} (via the duck-typed handle) before every write; the host pins
 * the active node id with {@link setActiveNodeId} as the conductor's head moves;
 * and {@link restore} rolls the working tree back to a node's recorded state.
 */
export declare class CheckpointStore {
    /** node id → (normalized abs path → first-seen pre-mutation content). */
    private readonly byNode;
    /** The transcript node the next {@link record} files its snapshot under. */
    private current;
    /** Normalize an absolute path into the store's canonical per-node key. */
    private key;
    /** The node id new snapshots are currently filed under (`null` until pinned). */
    activeNodeId(): string | null;
    /**
     * Pin the transcript node subsequent {@link record} calls file snapshots under.
     *
     * The conductor calls this as its head advances (at turn start), so all of a
     * turn's edits key to the node that was active before the turn ran. Passing the
     * same id again is harmless.
     *
     * @param id the active transcript node id, or `null` to fall back to the root
     */
    setActiveNodeId(id: string | null): void;
    /** The node id snapshots are filed under right now (active id or the root). */
    private resolveNodeId;
    /**
     * Capture the pre-mutation content of `absPath` under the active node.
     *
     * The framework's duck-typed `CheckpointHandle` entry point. Called once per
     * mutated path immediately before the write lands, with the file's OLD on-disk
     * content (or `null` when the file did not exist). First-seen wins: a later
     * `record` of the same path under the same node is ignored so the snapshot
     * reflects the file's state when the node became active, not a mid-turn rewrite.
     *
     * @param absPath  absolute path of the file about to be written
     * @param previous the file's content before this mutation, or `null` if absent
     */
    record(absPath: string, previous: string | null): void;
    /**
     * The recorded snapshots for a node, or `[]` when nothing was tracked there.
     *
     * Each entry pairs the normalized absolute path with the content it held before
     * the node's first mutation of it (`null` = the file was absent).
     *
     * @param nodeId the transcript node to read snapshots for
     */
    snapshotFor(nodeId: string): readonly FileSnapshot[];
    /** Whether a node has ANY recorded file snapshot (the picker's restore gate). */
    hasSnapshot(nodeId: string): boolean;
    /**
     * Roll the working tree back to a node's recorded state.
     *
     * For each path the node tracked: when its snapshot is a string, the file is
     * rewritten with that pre-mutation content (creating parent directories as
     * needed); when the snapshot is `null` the file is DELETED (it did not exist at
     * that point). Returns the absolute paths that were restored, in record order.
     *
     * A safe no-op when the node has no snapshot — navigating to a node that never
     * mutated files restores nothing. Per-path failures are swallowed so one
     * unwritable path never aborts the rest of the restore.
     *
     * @param nodeId the transcript node whose file state to restore to
     * @returns the absolute paths that were written or deleted
     */
    restore(nodeId: string): string[];
}
/** Mint a fresh, empty per-session checkpoint store. */
export declare function createCheckpointStore(): CheckpointStore;
