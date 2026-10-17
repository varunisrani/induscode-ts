/**
 * Model catalog printer — `printModelCatalog`.
 */
import { ModelRegistry, type KnownProvider, type Model } from "indusagi/ai";
import type { CatalogFilter } from "./contract.js";
import { applyCodingAgentModelOverlay } from "../models.js";

export interface CatalogIo {
  print(line: string): void;
}

export function defaultCatalogIo(): CatalogIo {
  return {
    print(line: string): void {
      process.stdout.write(line.endsWith("\n") ? line : `${line}\n`);
    },
  };
}

export interface CatalogModelSource {
  providers(): readonly (KnownProvider | string)[];
  models(provider: string): readonly Model<Model<string>["api"]>[];
}

export function registrySource(registry: ModelRegistry = new ModelRegistry()): CatalogModelSource {
  const overlaid = applyCodingAgentModelOverlay(registry);
  return {
    providers: (): readonly (KnownProvider | string)[] => overlaid.getProviders(),
    models: (provider: string): readonly Model<Model<string>["api"]>[] =>
      overlaid.getModels(provider),
  };
}

interface CatalogRow {
  provider: string;
  modelId: string;
  contextWindow: number;
  maxOutput: number;
  thinking: boolean;
  images: boolean;
}

const HEADERS = [
  "Provider",
  "Model",
  "Context",
  "Max Output",
  "Thinking",
  "Images",
];

function toRow(model: Model<Model<string>["api"]>): CatalogRow {
  const inputs = Array.isArray(model.input) ? model.input : [];
  return {
    provider: String(model.provider),
    modelId: model.id,
    contextWindow: typeof model.contextWindow === "number" ? model.contextWindow : 0,
    maxOutput: typeof model.maxTokens === "number" ? model.maxTokens : 0,
    thinking: model.reasoning === true,
    images: inputs.includes("image"),
  };
}

function filterRows(rows: readonly CatalogRow[], filter: CatalogFilter): CatalogRow[] {
  const providerNeedle =
    filter.provider !== undefined ? String(filter.provider).toLowerCase() : undefined;
  const searchNeedle = filter.search?.trim().toLowerCase();
  return rows.filter((row) => {
    if (providerNeedle !== undefined && row.provider.toLowerCase() !== providerNeedle) {
      return false;
    }
    if (filter.thinkingOnly === true && !row.thinking) return false;
    if (filter.imagesOnly === true && !row.images) return false;
    if (searchNeedle !== undefined && searchNeedle.length > 0) {
      const haystack = `${row.provider}/${row.modelId}`.toLowerCase();
      if (!haystack.includes(searchNeedle)) return false;
    }
    return true;
  });
}

function sortRows(rows: readonly CatalogRow[]): CatalogRow[] {
  return [...rows].sort((a, b) => {
    if (a.provider !== b.provider) return a.provider < b.provider ? -1 : 1;
    if (a.modelId !== b.modelId) return a.modelId < b.modelId ? -1 : 1;
    return 0;
  });
}

function formatTokenCount(tokens: number): string {
  if (tokens <= 0) return "-";
  if (tokens >= 1e6) {
    const millions = tokens / 1e6;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (tokens >= 1e3) return `${Math.round(tokens / 1e3)}K`;
  return String(tokens);
}

function cells(row: CatalogRow): string[] {
  return [
    row.provider,
    row.modelId,
    formatTokenCount(row.contextWindow),
    formatTokenCount(row.maxOutput),
    row.thinking ? "yes" : "no",
    row.images ? "yes" : "no",
  ];
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : `${value}${" ".repeat(width - value.length)}`;
}

function layout(rows: readonly CatalogRow[]): string[] {
  const body = rows.map(cells);
  const widths = HEADERS.map(
    (header, col) => body.reduce((max, row) => Math.max(max, row[col].length), header.length),
  );
  const render = (row: string[]): string =>
    row.map((cell, col) => pad(cell, widths[col])).join("  ").trimEnd();
  const rule = widths.map((width) => "-".repeat(width)).join("  ");
  return [render(HEADERS), rule, ...body.map(render)];
}

/**
 * Print the model catalog table.
 */
export function printModelCatalog(
  io: CatalogIo = defaultCatalogIo(),
  filter: CatalogFilter = {},
  source: CatalogModelSource = registrySource(),
): void {
  const all: CatalogRow[] = [];
  for (const provider of source.providers()) {
    let models: readonly Model<Model<string>["api"]>[];
    try {
      models = source.models(String(provider));
    } catch {
      continue;
    }
    for (const model of models) all.push(toRow(model));
  }
  const selected = sortRows(filterRows(all, filter));
  if (selected.length === 0) {
    io.print("No models match the given filter.");
    return;
  }
  for (const line of layout(selected)) io.print(line);
}