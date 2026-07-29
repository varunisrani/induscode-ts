/**
 * Per-session read-state store — the product half of the read-before-edit gate
 * (read-edit-gate, #11).
 *
 * The framework's file tools (read/write/edit) consult a host-injected handle on
 * `ctx.framework` under the string-literal key {@link READ_STATE_HANDLE_KEY} to
 * decide whether an edit/write may proceed: a file must have been read before it
 * is mutated, and an edit is refused when the file changed on disk since that
 * read. This module supplies the missing host piece — an in-memory map of which
 * files have been read this session and the stat fingerprint at read time — so
 * the gate has somewhere to record and look up that state.
 */
import { normalize } from "node:path";

/**
 * The string-literal key under which the host wires this store onto the deck's
 * `ctx.framework` bag.
 *
 * Mirrors the existing `DELEGATE_HANDLE_KEY = "delegate"` and
 * `MEMORY_HANDLE_KEY = "memoryStore"` conventions. The framework's file tools
 * read `ctx.framework["readState"]` by the same literal, so the two sides agree
 * by string rather than by a shared imported symbol.
 */
export const READ_STATE_HANDLE_KEY = "readState";

/**
 * One file's read fingerprint, recorded when the agent reads it this session.
 *
 *   - `mtimeMs` — the file's last-modified time (ms) at read. The gate refuses an
 *     edit when the on-disk mtime has advanced past this. (The framework's stat
 *     result names this `modifiedMs`; the host maps it to `mtimeMs` here.)
 *   - `size` — the file's byte length at read, a cheap secondary change signal.
 *   - `contentHash` — optional digest of the content read, for a content-equality
 *     fallback when the mtime advanced but the bytes are unchanged.
 *   - `readAt` — when the host recorded this read (ms since epoch).
 */
export interface ReadStateRecord {
  readonly mtimeMs: number;
  readonly size: number;
  readonly contentHash?: string;
  readonly readAt: number;
}

/**
 * In-memory map of read files for one session, keyed by normalized absolute path.
 *
 * The framework gate `set`s a record after every read and after every successful
 * mutation, and `get`s/`has`-checks it before an edit. Keys are normalized in one
 * place (`key`) so writes and lookups of the same file land on the same entry no
 * matter how the caller spelled the path.
 */
export class ReadStateStore {
  private readonly entries = new Map<string, ReadStateRecord>();

  /** Normalize an absolute path into the store's canonical key. */
  private key(absPath: string): string {
    return normalize(absPath);
  }

  /** The recorded read fingerprint for a path, or `undefined` if never read. */
  get(absPath: string): ReadStateRecord | undefined {
    return this.entries.get(this.key(absPath));
  }

  /** Record (or replace) the read fingerprint for a path; returns this store. */
  set(absPath: string, value: ReadStateRecord): this {
    this.entries.set(this.key(absPath), value);
    return this;
  }

  /** Whether a path has a recorded read fingerprint this session. */
  has(absPath: string): boolean {
    return this.entries.has(this.key(absPath));
  }

  /** Drop a path's recorded read fingerprint; returns whether one existed. */
  delete(absPath: string): boolean {
    return this.entries.delete(this.key(absPath));
  }

  /** Forget every recorded read for this session. */
  clear(): void {
    this.entries.clear();
  }
}

/** Mint a fresh, empty per-session read-state store. */
export function createReadStateStore(): ReadStateStore {
  return new ReadStateStore();
}
