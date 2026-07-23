// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * NDJSON framer — the concrete, separator-safe line transport.
 *
 * Implements the {@link NdjsonFramer} surface declared in the contract: a pure
 * encoder ({@link encodeLine}) and a pull-model async-generator decoder
 * ({@link decodeLines}). Both halves are I/O-free seams over an injected stream,
 * so the server, the driver, and the oneshot channel share one correct framing
 * implementation.
 *
 * The correctness pin: U+2028 (LINE SEPARATOR) and U+2029 (PARAGRAPH SEPARATOR)
 * are legal inside a JSON string but a downstream splitter that treats them as
 * line boundaries corrupts the frame. {@link encodeLine} escapes both to their
 * backslash-u forms, and {@link decodeLines} splits strictly on the line feed
 * (U+000A) only — so any value the encoder emits round-trips through the decoder
 * unchanged regardless of payload content.
 */
import type { DecodeLines, EncodeLine, NdjsonFramer } from "./contract";
/**
 * Encode one value as a single, separator-safe NDJSON line.
 *
 * Serializes `value` with `JSON.stringify`, escapes the two Unicode line
 * separators, and appends exactly one line feed. The result contains no raw
 * U+2028 / U+2029 and exactly one terminating `\n`, so a strictly-newline
 * splitter recovers it intact.
 *
 * @param value any JSON-serializable value (a request, a reply, or a signal)
 * @returns the encoded line, terminated by a single `\n`
 */
export declare const encodeLine: EncodeLine;
/**
 * Decode a chunk stream into a stream of parsed JSON values.
 *
 * Pull model: buffers incoming text, splits on `\n` only, parses each complete
 * line, and yields the parsed value. A partial trailing line is held until its
 * newline arrives; an empty (or whitespace-only) line is skipped. A trailing
 * unterminated line at end-of-stream is parsed if it carries content, so a
 * non-newline-terminated final frame is not silently dropped.
 *
 * @param stream the raw chunk stream (stdin, a child pipe, or an in-memory pipe)
 */
export declare const decodeLines: DecodeLines;
/**
 * The bundled framer pair: the canonical {@link NdjsonFramer} instance.
 *
 * Frozen so consumers share one implementation by reference rather than
 * re-deriving framing at each call site; an embedder may still inject an
 * alternate framer via the driver / server options.
 */
export declare const ndjsonFramer: NdjsonFramer;
