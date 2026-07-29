/**
 * NDJSON framer — the concrete, separator-safe line transport.
 */
import type { DecodeLines, EncodeLine, NdjsonFramer } from "./contract.js";

const LINE_FEED = "\n";
const LINE_SEPARATOR = "\u2028";
const LINE_SEPARATOR_ESCAPE = "\\u2028";
const PARAGRAPH_SEPARATOR_ESCAPE = "\\u2029";
const SEPARATOR_PATTERN = /[\u2028\u2029]/g;
const TEXT_DECODER = new TextDecoder();

function escapeSeparators(json: string): string {
  return json.replace(
    SEPARATOR_PATTERN,
    (ch) => (ch === LINE_SEPARATOR ? LINE_SEPARATOR_ESCAPE : PARAGRAPH_SEPARATOR_ESCAPE),
  );
}

export const encodeLine: EncodeLine = (value) =>
  escapeSeparators(JSON.stringify(value)) + LINE_FEED;

function chunkToText(chunk: string | Uint8Array): string {
  return typeof chunk === "string" ? chunk : TEXT_DECODER.decode(chunk, { stream: true });
}

export const decodeLines: DecodeLines = async function* (stream) {
  let buffer = "";
  for await (const chunk of stream) {
    buffer += chunkToText(chunk);
    let newlineAt = buffer.indexOf(LINE_FEED);
    while (newlineAt !== -1) {
      const line = buffer.slice(0, newlineAt);
      buffer = buffer.slice(newlineAt + 1);
      if (line.trim().length > 0) {
        yield JSON.parse(line);
      }
      newlineAt = buffer.indexOf(LINE_FEED);
    }
  }
  buffer += TEXT_DECODER.decode();
  if (buffer.trim().length > 0) {
    yield JSON.parse(buffer);
  }
};

export const ndjsonFramer: NdjsonFramer = Object.freeze({
  encodeLine,
  decodeLines,
});