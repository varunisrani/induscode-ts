// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
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
 *
 * Design notes:
 *   - The store is a thin wrapper over a `Map`, keyed by `path.normalize(absPath)`
 *     so a write and a later lookup of the SAME file agree on one key regardless
 *     of how the path was spelled (trailing slashes, `.`/`..` segments).
 *   - One instance is created PER SESSION (in `session.ts` `selectTools`) and
 *     shared across the read/write/edit cards through the single `ctx.framework`
 *     bag, so a read recorded by one tool is visible to the gate in another.
 *   - The record carries the stat fields the framework gate compares against:
 *     `mtimeMs` (the file's last-modified time at read), `size`, an optional
 *     `contentHash` for a content-equality fallback, and `readAt` (when the host
 *     recorded the read). The framework's own stat result exposes the modified
 *     time as `modifiedMs`; the host normalizes it into `mtimeMs` on the way in,
 *     so this record is the single agreed shape.
 *   - The handle key is a bare string literal (mirroring the deck's
 *     `DELEGATE_HANDLE_KEY` / `MEMORY_HANDLE_KEY`) so the framework consumer and
 *     this product injector agree WITHOUT a cross-package type import. `ctx.framework`
 *     is an open record, so the injection typechecks immediately.
 */
/**
 * The string-literal key under which the host wires this store onto the deck's
 * `ctx.framework` bag.
 *
 * Mirrors the existing `DELEGATE_HANDLE_KEY = "delegate"` and
 * `MEMORY_HANDLE_KEY = "memoryStore"` conventions. The framework's file tools
 * read `ctx.framework["readState"]` by the same literal, so the two sides agree
 * by string rather than by a shared imported symbol.
 */
export declare const READ_STATE_HANDLE_KEY: "readState";
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
 * place ({@link ReadStateStore.key}) so writes and lookups of the same file land
 * on the same entry no matter how the caller spelled the path.
 */
export declare class ReadStateStore {
    private readonly entries;
    /** Normalize an absolute path into the store's canonical key. */
    private key;
    /** The recorded read fingerprint for a path, or `undefined` if never read. */
    get(absPath: string): ReadStateRecord | undefined;
    /** Record (or replace) the read fingerprint for a path; returns this store. */
    set(absPath: string, value: ReadStateRecord): this;
    /** Whether a path has a recorded read fingerprint this session. */
    has(absPath: string): boolean;
    /** Drop a path's recorded read fingerprint; returns whether one existed. */
    delete(absPath: string): boolean;
    /** Forget every recorded read for this session. */
    clear(): void;
}
/** Mint a fresh, empty per-session read-state store. */
export declare function createReadStateStore(): ReadStateStore;
