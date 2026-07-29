/**
 * The usage renderer — generated entirely from {@link FLAG_SPECS}.
 */
import { FLAG_GROUPS, FLAG_SPECS, type GroupedFlagSpec } from "./flags.js";

const INDENT = "  ";
const SIGNATURE_COLUMN = 28;

function placeholder(spec: GroupedFlagSpec): string {
  switch (spec.kind) {
    case "boolean":
      return "";
    case "number":
      return " <n>";
    case "list":
      return " <a,b>";
    case "string":
    default:
      return " <value>";
  }
}

function signature(spec: GroupedFlagSpec): string {
  const aliases = spec.aliases ?? [];
  const aliasPart = aliases.length > 0 ? ` (${aliases.join(", ")})` : "";
  return `${spec.name}${aliasPart}${placeholder(spec)}`;
}

function optionLine(spec: GroupedFlagSpec): string {
  const sig = signature(spec);
  const pad = sig.length < SIGNATURE_COLUMN ? " ".repeat(SIGNATURE_COLUMN - sig.length) : "  ";
  return `${INDENT}${sig}${pad}${spec.describe}`;
}

function rowsForGroup(group: GroupedFlagSpec["group"]): GroupedFlagSpec[] {
  return FLAG_SPECS.filter((spec) => spec.group === group);
}

/**
 * Render the full usage banner.
 */
export function renderUsage(): string {
  const lines: string[] = [];
  lines.push("Usage: indusagi [options] [prompt] [@file ...]");
  lines.push("");
  lines.push("A terminal-first AI coding agent.");
  for (const group of FLAG_GROUPS) {
    const rows = rowsForGroup(group.id);
    if (rows.length === 0) continue;
    lines.push("");
    lines.push(`${group.title}:`);
    for (const spec of rows) {
      lines.push(optionLine(spec));
    }
  }
  lines.push("");
  lines.push("Arguments:");
  lines.push(
    `${INDENT}@file`.padEnd(SIGNATURE_COLUMN + INDENT.length) +
      "Attach a text or image file to the first message.",
  );
  lines.push(
    `${INDENT}--`.padEnd(SIGNATURE_COLUMN + INDENT.length) +
      "Stop parsing options; treat every later token as a positional.",
  );
  return lines.join("\n");
}