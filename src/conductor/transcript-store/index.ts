// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * transcript-store — the conductor's persistent, branchable transcript.
 *
 * Two cooperating pieces:
 *   - {@link TranscriptStore} — the append-only node tree bound to one session:
 *     `append`, `branchAt`, `pathTo`, `load`, with a pluggable storage backend.
 *   - the serialization bridge (re-exported below) — encode/decode the
 *     `indus/transcript@1` NDJSON line shape and project a branch down to the
 *     framework `AgentMessage[]` / LLM `Message[]`.
 *
 * Consumers (the conductor's submit/resume path) import the store and the
 * serialization helpers from `src/conductor/transcript-store` rather than reaching
 * into the individual modules.
 */
export { TranscriptStore, memoryBackend, fsBackend, replay, type TranscriptBackend, type TranscriptState, type TranscriptClock, type TranscriptStoreOptions, } from "./store";
export { roleForMessage, encodeEntry, encodeHead, parseSessionText, branchToMessages, branchToLlmMessages, importLegacyFile, importLegacyText, resolveLegacyMessages, type ParsedSessionFile, } from "./serialize";
