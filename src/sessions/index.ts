// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Sessions subsystem — public barrel.
 *
 * Exposes the {@link SessionLibrary} (the catalog-and-navigation layer over the
 * conductor's persisted transcripts) and its value contract — the
 * {@link SavedSession} catalog row, the {@link BranchNode} navigator row, and
 * the {@link PriorTurn} fork candidate. Consumers import the session-library
 * surface from `src/sessions` rather than reaching into the individual modules.
 */
export type { SavedSession, BranchNode, PriorTurn } from "./contract.js";
export { SessionLibrary, type SessionLibraryOptions } from "./library.js";
