// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Invocation subsystem — public barrel.
 *
 * Bundles the command-line behavior modules that all read the single
 * declarative {@link FLAG_SPECS} table:
 *
 *   - {@link readInvocation} — the generic, table-driven argv parser that folds
 *     a sliced argument vector into a typed {@link Invocation};
 *   - {@link renderUsage} — the `--help` banner generated from that same table,
 *     so help and parsing share one source of truth;
 *   - {@link gatherAttachments} — the `@file` expander that resolves references
 *     through the framework path resolver into inlined prose plus base64 media,
 *     raising a typed {@link AttachmentError} on failure.
 *
 * Consumers import the invocation surface from `src/launch/invocation` rather
 * than reaching into the individual modules.
 */
export { FLAG_SPECS, FLAG_GROUPS } from "./flags.js";
export type { FlagGroup, GroupedFlagSpec } from "./flags.js";
export { readInvocation, readFileReferences } from "./read.js";
export { renderUsage } from "./usage.js";
export { gatherAttachments, AttachmentError } from "./attachments.js";
export type { AttachmentErrorKind } from "./attachments.js";
