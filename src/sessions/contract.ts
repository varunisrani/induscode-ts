// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Session Library contract — the value types the library surface speaks in.
 *
 * The library sits on top of the conductor's persistent transcript store: it
 * enumerates the session files a workspace has accumulated, opens one back into
 * a live {@link TranscriptStore}, and projects the resulting node tree into the
 * flat shapes a navigator and a forking picker consume.
 *
 * These records are the *catalog/navigation* projections — the minimum a chooser
 * UI needs. They deliberately hold no framework message objects: text is already
 * reduced to a short preview, and identity is carried by stable string ids so a
 * caller can list, rename, delete, walk, and fork without rehydrating payloads.
 */
/**
 * One persisted session as the library catalogs it — what a chooser shows in a
 * list before anything is opened.
 *
 * `id` is the bare session identifier (the filename stem the conductor's
 * filesystem backend writes to); `path` is its absolute on-disk location. The
 * remaining fields are best-effort enrichments filled when the library is asked
 * to peek inside a file: a derived `name`, file `lastModified`/`size`, the
 * `messageCount` of conversational nodes, and a short `preview` of the opening
 * user turn. Any of them may be absent when only a shallow listing was taken.
 */
export interface SavedSession {
    /** Bare session identifier — the filename stem, no extension or directory. */
    readonly id: string;
    /** Absolute on-disk path the session persists to. */
    readonly path: string;
    /** Human-facing label for the session, when one could be derived. */
    readonly name?: string;
    /** Last-modified wall-clock time of the file, in epoch milliseconds. */
    readonly lastModified?: number;
    /** Byte size of the session file on disk. */
    readonly size?: number;
    /** Count of conversational (user/assistant/tool) nodes in the transcript. */
    readonly messageCount?: number;
    /** Short single-line excerpt of the opening turn, for at-a-glance recognition. */
    readonly preview?: string;
}
/**
 * One row in the flattened view of a loaded transcript tree.
 *
 * The conductor stores a branchable tree of nodes; a navigator wants a single
 * ordered list it can render and select against. Each {@link BranchNode} names
 * its `id`, its `parent` link (so a caller can still reconstruct the tree),
 * a render-ready `label`, the indentation `depth` from the root, and two flags:
 * `isLeaf` for a tip of the tree and `isCurrent` for the node the active head
 * points at.
 */
export interface BranchNode {
    /** Stable id of the underlying transcript node. */
    readonly id: string;
    /** Parent node id, or `null` for a transcript root. */
    readonly parent: string | null;
    /** Render-ready, depth-indented one-line label. */
    readonly label: string;
    /** Distance from the root (a root is depth 0). */
    readonly depth: number;
    /** True when this node has no children — a tip of the tree. */
    readonly isLeaf: boolean;
    /** True when the active head currently points at this node. */
    readonly isCurrent: boolean;
}
/**
 * A past user turn offered as a fork point.
 *
 * To re-ask or re-edit an earlier prompt, a caller picks one of these and the
 * conductor branches the transcript at `entryId`. `text` is the full prompt
 * text; `preview` is the trimmed single-line form a picker renders.
 */
export interface PriorTurn {
    /** Id of the transcript node this user turn lives on (the fork target). */
    readonly entryId: string;
    /** Full text of the user prompt. */
    readonly text: string;
    /** Trimmed single-line excerpt of {@link text}, for display. */
    readonly preview: string;
}
