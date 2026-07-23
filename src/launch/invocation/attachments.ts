// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * The attachment gatherer — expands `@file` references into one
 * {@link Attachments} value.
 *
 * Each `@file` token collected by the reader is resolved through the framework
 * path resolver ({@link resolveReadPath}, which handles `~` expansion and the
 * cwd), classified by extension, and folded into the result:
 *
 *   - **text files** are read as UTF-8 and inlined into {@link Attachments.prose}
 *     wrapped in a delimited block keyed by the resolved path, so the model sees
 *     which file each block came from;
 *   - **image files** are read as bytes, base64-encoded, and collected as
 *     framework {@link ImageContent} in {@link Attachments.media}.
 *
 * Guard rails:
 *   - an unknown extension, an oversized file, a missing file, or a read error
 *     raises a typed {@link AttachmentError} (with a {@link AttachmentErrorKind}
 *     discriminant) rather than a string or a process exit;
 *   - size caps bound the inlined text and the decoded image before either is
 *     materialised onto the message;
 *   - an empty file is skipped silently — it contributes neither prose nor media.
 *
 * The `@file` syntax, the extension classification, and base64 image attachment
 * are kept behaviours; only the typed-error model and the explicit caps are
 * owned here.
 */
import type { Attachments, AttachmentOptions } from "../contract";
/**
 * The closed set of attachment failure categories. A consumer switches on
 * {@link AttachmentError.kind}, never on message text:
 *
 *   - `unsupported`  — the file extension is neither text nor image.
 *   - `too-large`    — the file exceeds its kind's size cap.
 *   - `not-found`    — the resolved path does not exist.
 *   - `read-failed`  — the file could not be read or stat-ed.
 */
export type AttachmentErrorKind = "unsupported" | "too-large" | "not-found" | "read-failed";
/**
 * A typed `@file` expansion failure. Carries the offending reference and the
 * resolved path for diagnostics; {@link cause} preserves any wrapped error.
 */
export declare class AttachmentError extends Error {
    /** The failure category (the discriminant). */
    readonly kind: AttachmentErrorKind;
    /** The raw `@file` reference as supplied on the command line. */
    readonly reference: string;
    /** The resolved absolute path, when resolution succeeded. */
    readonly resolvedPath?: string;
    /** The wrapped underlying error, if any. */
    readonly cause?: unknown;
    constructor(kind: AttachmentErrorKind, message: string, detail: {
        reference: string;
        resolvedPath?: string;
        cause?: unknown;
    });
}
/**
 * Expand the `@file` references into a single {@link Attachments} value.
 *
 * Resolves each reference against {@link AttachmentOptions.cwd} via the framework
 * resolver, classifies it by extension, enforces the per-kind size cap, and
 * appends either a text block to the prose or an {@link ImageContent} to the
 * media. References list is taken in order; the prose blocks are joined with a
 * blank line between them. An empty references list yields an empty
 * {@link Attachments} (the caller decides whether to attach it at all).
 *
 * @param references the raw `@file` paths (without the leading `@`)
 * @param options    the cwd the references resolve against
 * @throws AttachmentError on an unsupported extension, an oversized file, a
 *         missing file, or a read failure
 */
export declare function gatherAttachments(references: readonly string[], options: AttachmentOptions): Promise<Attachments>;
