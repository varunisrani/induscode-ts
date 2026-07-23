// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * TranscriptStore — the conductor's persistent, branchable transcript.
 *
 * Replaces pi's `SessionManager`, but with the conductor's own vocabulary and a
 * deliberately different internal model. The transcript is an append-only **tree**
 * of {@link TranscriptEntry} nodes: every node names its `parent`, a single
 * {@link SessionHead} tracks the active `leaf`, and the active conversation is the
 * `parent`-chain walked from that leaf back to a root.
 *
 * Design stance (an independent persistence model):
 *   - **Reducer-friendly.** The on-disk form is a flat NDJSON log; the in-memory
 *     view is rebuilt by a pure {@link replay} reducer over that log. State is a
 *     value derived from the log, never mutated in place behind the scenes.
 *   - **Fresh envelope.** Lines carry the `indus/transcript@1` schema with our own
 *     field names (`prev`, `at`, `kind`), delegated to {@link module:serialize} —
 *     not any framework-internal session-manager schema.
 *   - **Branch = move the head.** {@link branchAt} repoints the leaf at an earlier
 *     node; the next {@link append} becomes that node's child, forking a new path
 *     without rewriting history.
 *   - **`pathTo` is the read primitive.** {@link pathTo} resolves the root→leaf
 *     branch (the message list the agent replays); the conductor's `resume` calls
 *     it to rehydrate.
 *
 * The store is storage-pluggable: a {@link TranscriptBackend} abstracts where bytes
 * live, so tests inject an in-memory backend and the conductor binds a filesystem
 * one. Construction is synchronous and empty; {@link load} hydrates from a backend.
 */
import type { AgentMessage, SessionHead, TranscriptEntry, TranscriptRole } from "../contract";
import { TRANSCRIPT_SCHEMA } from "../contract";
import type { Usage } from "indusagi/ai";
/**
 * Where a transcript's NDJSON log lives. The store appends lines and, on branch,
 * rewrites the whole file; a backend supplies those three primitives plus a way
 * to resolve a session id to its location. All methods may be async.
 *
 * The default {@link fsBackend} maps a session id to `<dir>/<sessionId>.ndjson`;
 * tests pass an in-memory backend so no disk is touched.
 */
export interface TranscriptBackend {
    /** Absolute location (path/key) a session id persists to. */
    locate(sessionId: string): string;
    /** Read the full NDJSON text for a session, or `null` if absent. */
    read(sessionId: string): Promise<string | null>;
    /** Append one already-encoded NDJSON line (no trailing newline) to a session. */
    append(sessionId: string, line: string): Promise<void>;
    /** Replace the whole NDJSON text for a session (used after a branch). */
    rewrite(sessionId: string, text: string): Promise<void>;
}
/** An in-memory backend — the default when no persistence is wired. */
export declare function memoryBackend(): TranscriptBackend;
/**
 * A filesystem backend rooted at `dir`. Lazily imports `node:fs`/`node:path` so
 * the module stays usable in non-Node test contexts that pass {@link memoryBackend}.
 */
export declare function fsBackend(dir: string): TranscriptBackend;
/**
 * The immutable derived state of a transcript: the node table keyed by id, plus
 * the current head. A pure value produced by {@link replay}; the store holds one
 * and swaps it wholesale on each mutation rather than mutating fields.
 */
export interface TranscriptState {
    /** Every node, keyed by id, in insertion order. */
    readonly nodes: ReadonlyMap<string, TranscriptEntry>;
    /** The active head (session id + current leaf). */
    readonly head: SessionHead;
}
/** A clock + id seam so tests get deterministic ids/timestamps. */
export interface TranscriptClock {
    /** Mint a fresh, sortable node id. */
    readonly id: () => string;
    /** The current instant as an ISO-8601 string. */
    readonly now: () => string;
}
/**
 * Rebuild a {@link TranscriptState} from an ordered entry list and a leaf.
 *
 * Pure and total: the same inputs always yield the same state. The reducer just
 * indexes the entries by id (later ids overwrite earlier — append-only logs never
 * collide, but a rewrite stays idempotent) and pins the head. Replacing pi's
 * mutate-in-place index with an explicit reducer is the divergence.
 */
export declare function replay(sessionId: string, entries: readonly TranscriptEntry[], leaf: string | null): TranscriptState;
/** Tuning seams for a {@link TranscriptStore}. All optional. */
export interface TranscriptStoreOptions {
    /** Where bytes live; defaults to {@link memoryBackend}. */
    readonly backend?: TranscriptBackend;
    /** Id/timestamp source; defaults to ULID + wall clock. */
    readonly clock?: TranscriptClock;
}
/**
 * An append-only, branchable transcript bound to one session id.
 *
 * Construct (empty), then either {@link append} fresh nodes or {@link load} a
 * persisted session. Every mutation appends to the backend and swaps the derived
 * {@link TranscriptState}. Reads (`pathTo`, `messages`, `head`) are O(branch
 * depth) walks over the in-memory node table.
 */
export declare class TranscriptStore {
    #private;
    constructor(sessionId: string, options?: TranscriptStoreOptions);
    /** The session id this store is bound to. */
    get sessionId(): string;
    /** The current head (session id + active leaf). */
    get head(): SessionHead;
    /**
     * The cumulative session usage last persisted onto the head, or `undefined`
     * when none has been written (a fresh session, or a legacy file without a
     * usage-bearing head). `resume` reads this to restore the running token/cost
     * total instead of seeding zero.
     */
    get usage(): Usage | undefined;
    /** Number of nodes currently in the transcript. */
    get size(): number;
    /** Backend location this session persists to (for diagnostics/UI). */
    locate(sessionId?: string): string;
    /** Look up a single node by id. */
    get(id: string): TranscriptEntry | undefined;
    /**
     * Append a framework {@link AgentMessage} as a child of the current leaf and
     * advance the head onto it. The node role is derived from the message (or
     * overridden via `role`). Persists the new line, then returns the new node.
     *
     * This is the conductor's per-message write: one call per produced message in
     * a settled turn.
     */
    append(content: AgentMessage, role?: TranscriptRole, meta?: Readonly<Record<string, unknown>>): Promise<TranscriptEntry>;
    /**
     * Persist the session's cumulative usage onto the head and rewrite the backing
     * file so the running token/cost total survives a reload. Distinct from
     * {@link append}, which only appends an entry line and never rewrites the head:
     * usage durability MUST flow through here so the re-emitted head line carries
     * the latest tally. Leaves the node tree and active leaf untouched.
     *
     * @param usage the cumulative usage to pin on the head
     */
    persistUsage(usage: Usage): Promise<void>;
    /**
     * Repoint the head at an earlier node, forking a branch. The next {@link append}
     * becomes a child of `id`; existing nodes are untouched. Rewrites the head line.
     *
     * @throws if `id` is not a known node.
     */
    branchAt(id: string): Promise<void>;
    /**
     * Reset the head to before any node; the next {@link append} starts a new root.
     * Used when re-editing the very first turn.
     */
    reset(): Promise<void>;
    /**
     * Abandon the current conversation and begin a fresh, empty session under a new
     * id. All nodes are dropped and the leaf is reset to null, so {@link messages}
     * is empty and the next {@link append} starts a new root; subsequent writes
     * persist to the new session's backing file (the old one is left intact on
     * disk). This is the `/clear` (new-session) primitive — distinct from
     * {@link reset}, which keeps the nodes and id and only rewinds the head.
     */
    startNewSession(sessionId: string): void;
    /**
     * Resolve the active branch: the root→leaf node list reached by walking
     * `parent` links up from `leaf` (or from `from` when given), reversed to
     * chronological order.
     *
     * This is the conductor's read primitive — `resume` rehydrates the agent from
     * `pathTo()`, and the turn loop projects it to messages via {@link messages}.
     * Returns `[]` for an empty transcript or a dangling leaf.
     */
    pathTo(from?: string): TranscriptEntry[];
    /** The active branch projected to the framework {@link AgentMessage} list. */
    messages(from?: string): AgentMessage[];
    /**
     * Hydrate this store from a persisted session, replacing its current state.
     *
     * Reads the backend, parses it with {@link parseSessionText}, and rebuilds state
     * via the {@link replay} reducer. If the file carried no head line, the head is
     * pinned to the deepest leaf reachable from the entries. Returns `true` when a
     * session was found and loaded, `false` when the backend had nothing.
     */
    load(sessionId?: string): Promise<boolean>;
    /**
     * Open a persisted session by id, returning a hydrated store (or `null` if the
     * backend has no such session). The static counterpart to {@link load}.
     */
    static open(sessionId: string, options?: TranscriptStoreOptions): Promise<TranscriptStore | null>;
    /** A point-in-time copy of the derived state (for inspection/testing). */
    state(): TranscriptState;
}
/** Re-export the schema literal for callers building stores directly. */
export { TRANSCRIPT_SCHEMA };
