// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * SessionLibrary — the catalog-and-navigation layer over persisted transcripts.
 *
 * The conductor owns a single session at a time as a {@link TranscriptStore}.
 * The library owns the *collection*: it scans the workspace `sessions/`
 * directory for the NDJSON files the conductor's filesystem backend writes,
 * lists them as {@link SavedSession} catalog rows, opens any one back into a
 * live store via the store's own loader + {@link replay} reducer, and offers the
 * two read projections a chooser UI needs — a flattened {@link BranchNode} tree
 * for a branch navigator and a {@link PriorTurn} list for re-asking an earlier
 * prompt. It also performs the two file-level mutations a manager needs:
 * renaming and deleting a session on disk.
 *
 * The library never re-implements transcript parsing or message serialization —
 * it delegates entirely to the conductor's transcript-store surface
 * ({@link TranscriptStore}, {@link fsBackend}, {@link replay}). Its own logic is
 * purely the directory enumeration, the tree flatten, and the text reduction.
 */
import { TranscriptStore } from "../conductor";
import type { BranchNode, PriorTurn, SavedSession } from "./contract";
/** Construction inputs — just the directory sessions live under. */
export interface SessionLibraryOptions {
    /** Absolute path to the workspace `sessions/` directory. */
    readonly sessionsDir: string;
}
/**
 * The collection-level handle over a workspace's persisted sessions.
 *
 * Construct it with the resolved `sessionsDir` (from the workspace locator),
 * then call {@link list} / {@link open} / {@link rename} / {@link remove} to
 * manage files, and {@link tree} / {@link priorTurns} to project a loaded
 * transcript for navigation and forking.
 */
export declare class SessionLibrary {
    #private;
    constructor(options: SessionLibraryOptions);
    /** The sessions directory this library is rooted at. */
    get directory(): string;
    /**
     * Enumerate persisted sessions as catalog rows, newest-modified first.
     *
     * Scans the directory for `*.ndjson` files and `stat`s each for its size and
     * modification time. When `deep` is set, it also opens each file to fill in
     * `messageCount` and the opening-turn `preview`; otherwise it returns the
     * shallow rows (id/path/size/lastModified) so a large directory lists fast.
     * A missing directory yields an empty list rather than an error.
     */
    list(options?: {
        readonly deep?: boolean;
    }): Promise<SavedSession[]>;
    /**
     * Open a persisted session back into a live, hydrated {@link TranscriptStore},
     * or return `null` when no file with that id exists.
     *
     * Delegates to the store's own static opener, which reads the backend and
     * rebuilds state through the {@link replay} reducer — the library adds nothing
     * to the rehydration beyond binding the filesystem backend.
     */
    open(id: string): Promise<TranscriptStore | null>;
    /**
     * Rename a session file from one id to another, returning the new absolute
     * path. The on-disk identifier *is* the filename stem, so this is a plain file
     * move; the in-file head still names the old id, which the store tolerates on
     * the next load (the head's leaf is what matters, not its session label).
     *
     * @throws if the source file is missing or the target id already exists.
     */
    rename(fromId: string, toId: string): Promise<string>;
    /**
     * Delete a session file. Returns `true` when a file was removed, `false` when
     * there was nothing to delete — never throws on an already-absent session.
     */
    remove(id: string): Promise<boolean>;
    /** Absolute path a session id persists to. */
    pathOf(id: string): string;
    /**
     * Flatten a loaded transcript into an ordered {@link BranchNode} list for a
     * tree navigator.
     *
     * Walks every node from each root downward in a stable depth-first order,
     * emitting one row per node with its render label, depth indentation, leaf
     * flag, and a current-marker derived from the store's active head. A node is a
     * leaf when no other node names it as `parent`.
     */
    tree(store: TranscriptStore): BranchNode[];
    /**
     * Extract the user prompts along a loaded transcript's active branch as fork
     * candidates, in chronological order.
     *
     * Reads the root→leaf branch the store currently points at (the conversation
     * the agent would replay) and keeps only the user-role nodes that carry real
     * text, projecting each to a {@link PriorTurn} a forking picker can offer.
     */
    priorTurns(store: TranscriptStore): PriorTurn[];
}
