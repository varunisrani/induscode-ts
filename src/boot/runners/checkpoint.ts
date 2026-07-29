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
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname as dirname2, normalize as normalize2 } from "node:path";

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
export const CHECKPOINT_HANDLE_KEY = "checkpoint";

const ROOT_NODE_ID = "__root__";

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
 * `record` (via the duck-typed handle) before every write; the host pins the
 * active node id with `setActiveNodeId` as the conductor's head moves; and
 * `restore` rolls the working tree back to a node's recorded state.
 */
export class CheckpointStore {
  /** node id → (normalized abs path → first-seen pre-mutation content). */
  private readonly byNode = new Map<string, Map<string, string | null>>();

  /** The transcript node the next `record` files its snapshot under. */
  private current: string | null = null;

  /** Normalize an absolute path into the store's canonical per-node key. */
  private key(absPath: string): string {
    return normalize2(absPath);
  }

  /** The node id new snapshots are currently filed under (`null` until pinned). */
  activeNodeId(): string | null {
    return this.current;
  }

  /**
   * Pin the transcript node subsequent `record` calls file snapshots under.
   *
   * The conductor calls this as its head advances (at turn start), so all of a
   * turn's edits key to the node that was active before the turn ran. Passing
   * the same id again is harmless.
   *
   * @param id the active transcript node id, or `null` to fall back to the root
   */
  setActiveNodeId(id: string | null): void {
    this.current = id;
  }

  /** The node id snapshots are filed under right now (active id or the root). */
  private resolveNodeId(): string {
    return this.current ?? ROOT_NODE_ID;
  }

  /**
   * Capture the pre-mutation content of `absPath` under the active node.
   *
   * The framework's duck-typed `CheckpointHandle` entry point. Called once per
   * mutated path immediately before the write lands, with the file's OLD
   * on-disk content (or `null` when the file did not exist). First-seen wins:
   * a later `record` of the same path under the same node is ignored so the
   * snapshot reflects the file's state when the node became active, not a
   * mid-turn rewrite.
   *
   * @param absPath  absolute path of the file about to be written
   * @param previous the file's content before this mutation, or `null` if absent
   */
  record(absPath: string, previous: string | null): void {
    const nodeId = this.resolveNodeId();
    let paths = this.byNode.get(nodeId);
    if (paths === undefined) {
      paths = new Map<string, string | null>();
      this.byNode.set(nodeId, paths);
    }
    const k = this.key(absPath);
    if (paths.has(k)) return;
    paths.set(k, previous);
  }

  /**
   * The recorded snapshots for a node, or `[]` when nothing was tracked there.
   *
   * Each entry pairs the normalized absolute path with the content it held
   * before the node's first mutation of it (`null` = the file was absent).
   *
   * @param nodeId the transcript node to read snapshots for
   */
  snapshotFor(nodeId: string): readonly FileSnapshot[] {
    const paths = this.byNode.get(nodeId);
    if (paths === undefined) return [];
    return [...paths].map(([path, previous]) => ({ path, previous }));
  }

  /** Whether a node has ANY recorded file snapshot (the picker's restore gate). */
  hasSnapshot(nodeId: string): boolean {
    const paths = this.byNode.get(nodeId);
    return paths !== undefined && paths.size > 0;
  }

  /**
   * Roll the working tree back to a node's recorded state.
   *
   * For each path the node tracked: when its snapshot is a string, the file
   * is rewritten with that pre-mutation content (creating parent directories
   * as needed); when the snapshot is `null` the file is DELETED (it did not
   * exist at that point). Returns the absolute paths that were restored, in
   * record order.
   *
   * A safe no-op when the node has no snapshot — navigating to a node that
   * never mutated files restores nothing. Per-path failures are swallowed so
   * one unwritable path never aborts the rest of the restore.
   *
   * @param nodeId the transcript node whose file state to restore to
   * @returns the absolute paths that were written or deleted
   */
  restore(nodeId: string): string[] {
    const snapshots = this.snapshotFor(nodeId);
    const restored: string[] = [];
    for (const { path, previous } of snapshots) {
      try {
        if (previous === null) {
          rmSync(path, { force: true });
        } else {
          mkdirSync(dirname2(path), { recursive: true });
          writeFileSync(path, previous, "utf8");
        }
        restored.push(path);
      } catch {
        // swallow per-path failures — never abort the rest of the restore
      }
    }
    return restored;
  }
}

/** Mint a fresh, empty per-session checkpoint store. */
export function createCheckpointStore(): CheckpointStore {
  return new CheckpointStore();
}
