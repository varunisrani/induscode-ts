// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Transcript serialization — the bridge between the conductor's on-disk
 * {@link TranscriptEntry} vocabulary and the framework's {@link AgentMessage}
 * shapes.
 *
 * Two distinct directions live here, and the split is deliberate:
 *
 *   1. **Conductor ⇄ conductor** — encoding a {@link TranscriptEntry} to/from a
 *      single NDJSON line in the `indus/transcript@1` format. This is the
 *      conductor's *own* envelope (`schema`/`id`/`prev`/`role`/`message`/`at`/
 *      `meta`). The store owns these field names; they are our own, not any
 *      framework-internal session schema.
 *
 *   2. **Conductor ⇄ framework** — projecting a transcript branch down to the
 *      `AgentMessage[]` the agent loop consumes, and (for migration) lifting a
 *      legacy framework session file *up* into transcript entries. Here we
 *      **delegate the actual message serialization to the framework**: the
 *      framework's published loader/context helpers know how to parse and resolve
 *      the legacy on-disk schema, and we keep those internal schema literals
 *      inside the framework package rather than re-declaring them in the app.
 *
 * The role discriminant on a {@link TranscriptEntry} is the conductor's own —
 * `role` here labels the *node*, not the LLM message. We derive it from the
 * carried {@link AgentMessage}'s `role` field so a round-trip is faithful, but
 * the transcript can also hold conductor-only nodes (`condense`, `note`) that the
 * framework message union has no direct counterpart for.
 */
import type { AgentMessage } from "indusagi/agent";
import type { Message } from "indusagi/ai";
import type { SessionHead, TranscriptEntry, TranscriptRole } from "../contract";
/**
 * Derive the conductor's node {@link TranscriptRole} from a framework
 * {@link AgentMessage}.
 *
 * The framework message union uses `role` values (`user`/`assistant`/`toolResult`
 * plus the custom app messages). We fold those onto the transcript's own role
 * vocabulary. Anything we don't recognize (custom/notification-style messages)
 * is filed as a `note` node so it persists without claiming an LLM turn role.
 */
export declare function roleForMessage(message: AgentMessage): TranscriptRole;
/** Encode one {@link TranscriptEntry} to its NDJSON entry line (no newline). */
export declare function encodeEntry(entry: TranscriptEntry): string;
/** Encode the {@link SessionHead} to its NDJSON head line (no newline). */
export declare function encodeHead(head: SessionHead): string;
/** The result of parsing a whole session file: its head plus its entries. */
export interface ParsedSessionFile {
    readonly head: SessionHead | null;
    readonly entries: TranscriptEntry[];
}
/**
 * Parse the raw text of a conductor session file into a head + entries.
 *
 * Tolerant by design: blank lines are skipped, malformed lines are dropped, and
 * lines whose `schema` does not match `indus/transcript@1` are ignored. The last
 * head line wins (a file should carry exactly one, written first and rewritten on
 * branch). Entries keep file order.
 */
export declare function parseSessionText(sessionId: string, text: string): ParsedSessionFile;
/**
 * Project a resolved transcript branch down to the framework `AgentMessage[]`
 * the agent loop consumes.
 *
 * The branch is the root→leaf node list (the store's reducer produces it). We
 * pull the carried `content` payloads and hand them straight to the agent; they
 * are already framework messages. Conductor-only nodes whose payload is not a
 * real message would be filtered by the framework's own `convertToLlm` at call
 * time, so we keep them here and let the loop's converter decide.
 */
export declare function branchToMessages(branch: readonly TranscriptEntry[]): AgentMessage[];
/**
 * Convert a transcript branch to *LLM-ready* `Message[]`, delegating entirely to
 * the framework's {@link convertToLlm}.
 *
 * This is the one place that must understand how each `AgentMessage` variant
 * (including the framework's custom `bashExecution`/`branchSummary`/… messages)
 * collapses into a plain LLM message — and that knowledge stays in the framework.
 * The conductor never re-implements it.
 */
export declare function branchToLlmMessages(branch: readonly TranscriptEntry[]): Message[];
/**
 * Lift a *legacy framework session file* into conductor {@link TranscriptEntry}
 * nodes, for one-way migration/import.
 *
 * The legacy file is the framework's own internal JSONL format. We do **not**
 * parse its schema ourselves — we call the framework's published loader (or its
 * in-memory text parser), then map only the message-bearing entries onto our
 * envelope. Every framework-internal schema literal stays behind that call.
 *
 * Non-message bookkeeping entries (model/thinking changes, labels, raw
 * compaction markers) are dropped from the imported transcript: their effect is
 * already folded into the resolved messages we keep, and the conductor tracks
 * model/thinking in its own state rather than as transcript nodes.
 */
export declare function importLegacyFile(filePath: string): TranscriptEntry[];
/** As {@link importLegacyFile}, but from already-loaded text (testing/import). */
export declare function importLegacyText(text: string): TranscriptEntry[];
/**
 * Resolve a legacy framework file straight to the `AgentMessage[]` of its active
 * branch, delegating to the framework's {@link buildSessionContext}.
 *
 * Useful when the goal is to *seed* a fresh conductor session from a legacy one
 * without reproducing its tree: the framework walks its own parent links and
 * applies its own compaction/branch-summary resolution, and we receive a flat
 * message list to re-append as new transcript nodes.
 */
export declare function resolveLegacyMessages(filePath: string): AgentMessage[];
