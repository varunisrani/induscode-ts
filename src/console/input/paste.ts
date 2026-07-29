/**
 * Paste coalescing — collapse a large clipboard burst into one compact marker.
 */

export interface PasteThresholds {
  readonly lines: number;
  readonly chars: number;
}

export const PASTE_THRESHOLDS: PasteThresholds = { lines: 10, chars: 1001 };
export const PASTE_BURST_GAP_MS = 24;
export const PASTE_CONTINUATION_MS = 250;
export const PASTE_MARKER_LINE_CAP = 1000;

/** The console's own placeholder format for a hidden paste body. */
export function pasteMarker(ordinal: number, lineCount: number): string {
  return `[Pasted text #${ordinal}${lineCount > 0 ? ` +${lineCount} lines` : ""}]`;
}

function markerScanner() {
  return /\[Pasted text #(\d+)(?: \+\d+ lines)?\]/g;
}

function lineBreaks(chunk: string) {
  let count = 0;
  for (let i = 0; i < chunk.length; i++) {
    if (chunk.charCodeAt(i) === 10) count++;
  }
  return count;
}

/**
 * Decide whether a pasted chunk is large enough to hide behind a marker.
 */
export function classifyPaste(chunk: string, thresholds: PasteThresholds = PASTE_THRESHOLDS): "inline" | "coalesce" {
  if (chunk.length >= thresholds.chars) return "coalesce";
  if (lineBreaks(chunk) >= thresholds.lines) return "coalesce";
  return "inline";
}

export interface PasteVault {
  readonly bodies: ReadonlyMap<number, string>;
  readonly minted: number;
}

export const EMPTY_PASTE_VAULT: PasteVault = { bodies: new Map(), minted: 0 };

export interface PasteCapture {
  readonly marker: string;
  readonly vault: PasteVault;
}

/**
 * Mint a marker for a large paste and record its body in a fresh vault.
 */
export function coalescePaste(body: string, vault: PasteVault = EMPTY_PASTE_VAULT): PasteCapture {
  const ordinal = vault.minted + 1;
  const lineCount = body.length === 0 ? 0 : lineBreaks(body) + 1;
  const marker = pasteMarker(ordinal, lineCount);
  const bodies = new Map(vault.bodies);
  bodies.set(ordinal, body);
  return { marker, vault: { bodies, minted: ordinal } };
}

/**
 * Grow an existing paste body with a follow-on chunk, reminting its marker.
 */
export function appendToPaste(ordinal: number, extra: string, vault: PasteVault): PasteCapture {
  const body = (vault.bodies.get(ordinal) ?? "") + extra;
  const lineCount = body.length === 0 ? 0 : lineBreaks(body) + 1;
  const marker = pasteMarker(ordinal, lineCount);
  const bodies = new Map(vault.bodies);
  bodies.set(ordinal, body);
  return { marker, vault: { bodies, minted: vault.minted } };
}

/**
 * The line count of an ordinal's stored body.
 */
export function pasteLines(vault: PasteVault, ordinal: number): number {
  const body = vault.bodies.get(ordinal);
  if (body === void 0 || body.length === 0) return 0;
  return lineBreaks(body) + 1;
}

/**
 * Rewrite every paste marker in a buffer back to the text it stands for.
 */
export function expandMarkers(buffer: string, vault: PasteVault): string {
  if (vault.bodies.size === 0) return buffer;
  return buffer.replace(markerScanner(), (match, ordinalStr) => {
    const ordinal = parseInt(ordinalStr, 10);
    const body = vault.bodies.get(ordinal);
    return body === void 0 ? match : body;
  });
}

/**
 * Report whether a buffer still contains any minted paste marker.
 */
export function hasMarkers(buffer: string, vault: PasteVault): boolean {
  if (vault.bodies.size === 0) return false;
  return markerScanner().test(buffer);
}