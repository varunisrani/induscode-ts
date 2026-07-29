export interface SkillInvocation {
  readonly name: string;
  readonly args: Record<string, string>;
  readonly body: string;
}

const SKILL_TAG = "skill";
const NAME_ATTR = "name";

function isSpace(ch: string | undefined): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f" || ch === "\v";
}
function isKeyStart(ch: string | undefined): boolean {
  return ch !== undefined && ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_");
}
function isKeyChar(ch: string | undefined): boolean {
  return isKeyStart(ch) || (ch !== undefined && ch >= "0" && ch <= "9") || ch === "-" || ch === ":" || ch === ".";
}
function skipSpace(text: string, index: number): number {
  while (index < text.length && isSpace(text[index])) index++;
  return index;
}
function decodeEntities(raw: string): string {
  if (!raw.includes("&")) return raw;
  return raw.replace(/&(#39|#x27|#34|#x22|amp|lt|gt|quot|apos);/gi, (match, code: string) => {
    switch (code.toLowerCase()) {
      case "amp": return "&";
      case "lt": return "<";
      case "gt": return ">";
      case "quot": case "#34": case "#x22": return '"';
      case "apos": case "#39": case "#x27": return "'";
      default: return match;
    }
  });
}
function scanAttribute(text: string, index: number): { key: string; value: string; next: number } | null {
  let cursor = index;
  if (!isKeyStart(text[cursor])) return null;
  cursor++;
  while (cursor < text.length && isKeyChar(text[cursor])) cursor++;
  const key = text.slice(index, cursor).toLowerCase();
  const afterKey = skipSpace(text, cursor);
  if (text[afterKey] !== "=") return { key, value: "", next: cursor };
  cursor = skipSpace(text, afterKey + 1);
  const quote = text[cursor];
  if (quote === '"' || quote === "'") {
    const start = cursor + 1;
    let end = start;
    while (end < text.length && text[end] !== quote) end++;
    if (end >= text.length) return { key, value: decodeEntities(text.slice(start)), next: text.length };
    return { key, value: decodeEntities(text.slice(start, end)), next: end + 1 };
  }
  const start = cursor;
  while (cursor < text.length && !isSpace(text[cursor]) && text[cursor] !== ">" && text[cursor] !== "/") cursor++;
  return { key, value: decodeEntities(text.slice(start, cursor)), next: cursor };
}
function trimBodyEdges(body: string): string {
  let result = body;
  if (result.startsWith("\r\n")) result = result.slice(2);
  else if (result.startsWith("\n") || result.startsWith("\r")) result = result.slice(1);
  if (result.endsWith("\r\n")) result = result.slice(0, -2);
  else if (result.endsWith("\n") || result.endsWith("\r")) result = result.slice(0, -1);
  return result;
}
function findCloseTag(text: string, index: number): number | null {
  let cursor = index;
  while (cursor < text.length) {
    const left = text.indexOf("<", cursor);
    if (left === -1) return null;
    let scan = left + 1;
    if (text[scan] !== "/") { cursor = left + 1; continue; }
    scan = skipSpace(text, scan + 1);
    const start = scan;
    while (scan < text.length && isKeyChar(text[scan])) scan++;
    if (text.slice(start, scan).toLowerCase() !== SKILL_TAG) { cursor = left + 1; continue; }
    scan = skipSpace(text, scan);
    if (text[scan] === ">") return left;
    cursor = left + 1;
  }
  return null;
}

export function parseSkillInvocation(text: string): SkillInvocation | null {
  let index = skipSpace(text, 0);
  if (text[index] !== "<") return null;
  index++;
  const tagStart = index;
  while (index < text.length && isKeyChar(text[index])) index++;
  if (text.slice(tagStart, index).toLowerCase() !== SKILL_TAG) return null;
  const afterTag = text[index];
  if (afterTag !== undefined && !isSpace(afterTag) && afterTag !== ">" && afterTag !== "/") return null;
  const args: Record<string, string> = {};
  for (;;) {
    index = skipSpace(text, index);
    const ch = text[index];
    if (ch === undefined || ch === "/") return null;
    if (ch === ">") { index++; break; }
    const scan = scanAttribute(text, index);
    if (!scan) return null;
    if (!(scan.key in args)) args[scan.key] = scan.value;
    index = scan.next;
  }
  const name = args[NAME_ATTR];
  if (!name) return null;
  const close = findCloseTag(text, index);
  if (close === null) return null;
  return { name, args, body: trimBodyEdges(decodeEntities(text.slice(index, close))) };
}
