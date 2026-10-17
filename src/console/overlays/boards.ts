/**
 * Saffron picker boards — the themed `/settings` and `/model` overlays.
 */
import chalk from "chalk";
import { useEffect, useMemo, useState } from "indusagi/react-host";
import { Box, Text, useInput } from "indusagi/react-host/ink";
import {
  matchesSearchQuery,
  wrapSelectionIndex,
  type InkThemeAdapter,
  type SettingsDialogItem
} from "indusagi/react-ink";
import type { Model } from "indusagi/ai";
import { Fragment, jsx, jsxs } from "indusagi/react-host/jsx-runtime";


function truncate(text: string, width: number): string {
  if (text.length <= width) return text;
  if (width <= 1) return text.slice(0, width);
  return `${text.slice(0, width - 1)}…`;
}

function tabPill(theme: InkThemeAdapter, text: string): string {
  const accent = theme.colors["accent"] ?? "#f7a23f";
  try {
    return chalk.bgHex(accent).hex("#1a120a").bold(` ${text} `);
  } catch {
    return theme.color("accent", text);
  }
}

function paintValue(theme: InkThemeAdapter, value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "on" || v === "true" || v === "yes" || v === "enabled") {
    return theme.color("success", value);
  }
  if (v === "off" || v === "false" || v === "no" || v === "disabled") {
    return theme.dim(value);
  }
  return theme.color("customMessage", value);
}

function visibleRowBudget(): number {
  return Math.max(6, (process.stdout.rows ?? 24) - 18);
}

function windowAround(total: number, selectedIndex: number) {
  const budget = visibleRowBudget();
  const start = Math.max(0, Math.min(selectedIndex - Math.floor(budget / 2), Math.max(0, total - budget)));
  const below = Math.max(0, total - (start + budget));
  return { start, budget, below };
}

function SearchBox({ theme, query, placeholder }: { theme: InkThemeAdapter; query: string; placeholder: string }) {
  return jsxs(Box, {
    borderStyle: "round",
    borderColor: theme.colors["customMessage"],
    paddingX: 1,
    marginBottom: 1,
    children: [
      jsx(Text, { children: theme.color("customMessage", "⌕  ") }),
      query.length > 0
        ? jsxs(Fragment, {
            children: [
              jsx(Text, { children: theme.color("text", query) }),
              jsx(Text, { inverse: true, children: " " })
            ]
          })
        : jsxs(Fragment, {
            children: [
              jsx(Text, { inverse: true, children: " " }),
              jsx(Text, { children: theme.dim(` ${placeholder}`) })
            ]
          })
    ]
  });
}

function BoardFooter({ theme, hint, detail }: { theme: InkThemeAdapter; hint: string; detail?: string }) {
  return jsxs(Box, {
    flexDirection: "column",
    marginTop: 1,
    children: [
      detail ? jsx(Box, { marginBottom: 1, children: jsx(Text, { children: theme.muted(detail) }) }) : null,
      jsx(Box, {
        borderStyle: "single",
        borderColor: theme.colors["borderMuted"],
        borderTop: true,
        borderBottom: false,
        borderLeft: false,
        borderRight: false,
        paddingTop: 0,
        children: jsx(Text, { children: theme.dim(hint) })
      })
    ]
  });
}

function BoardShell({ theme, title, query, placeholder, below, hint, detail, children }: any) {
  return jsxs(Box, {
    flexDirection: "column",
    borderStyle: "round",
    borderColor: theme.colors["accent"],
    paddingX: 1,
    marginTop: 1,
    children: [
      jsx(Box, { marginBottom: 1, children: jsx(Text, { children: tabPill(theme, title) }) }),
      jsx(SearchBox, { theme, query, placeholder }),
      children,
      below > 0 ? jsx(Box, { marginTop: 0, children: jsx(Text, { children: theme.dim(`↓ ${below} more below`) }) }) : null,
      jsx(BoardFooter, { theme, hint, detail })
    ]
  });
}

const SETTINGS_LABEL_WIDTH = 34;

function nextValue(values: readonly string[], current: string | undefined, direction: number): string | undefined {
  if (values.length === 0) return void 0;
  const at = Math.max(0, values.indexOf(current as string));
  return values[(at + direction + values.length) % values.length];
}

export interface SettingsBoardProps {
  readonly theme: InkThemeAdapter;
  readonly items: readonly SettingsDialogItem[];
  readonly onClose: () => void;
}

export function SettingsBoard({ theme, items, onClose }: SettingsBoardProps) {
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const filtered = useMemo(
    () =>
      items.filter((item) =>
        matchesSearchQuery(`${item.label} ${item.description} ${item.value} ${item.values.join(" ")}`, query)
      ),
    [items, query]
  );
  useEffect(() => setSelectedIndex(0), [query]);
  useEffect(() => {
    if (selectedIndex >= filtered.length) setSelectedIndex(0);
  }, [filtered.length, selectedIndex]);
  const cycle = (direction: number) => {
    const item = filtered[selectedIndex];
    if (!item) return;
    const value = nextValue(item.values, item.value, direction);
    if (value && value !== item.value) {
      setError(undefined);
      const failed = (error: unknown) => setError(error instanceof Error ? error.message : String(error));
      try { void Promise.resolve(item.onChange(value)).catch(failed); } catch (error) { failed(error); }
    }
  };
  useInput((input, key) => {
    if (key.escape) return onClose();
    if (key.upArrow) return setSelectedIndex((c) => wrapSelectionIndex(c, -1, filtered.length));
    if (key.downArrow) return setSelectedIndex((c) => wrapSelectionIndex(c, 1, filtered.length));
    if (key.backspace || key.delete) return setQuery((c) => c.slice(0, -1));
    if (key.ctrl && input === "u") return setQuery("");
    if (key.leftArrow) return cycle(-1);
    if (key.rightArrow || key.return) return cycle(1);
    if (!key.ctrl && !key.meta && input) setQuery((c) => c + input);
  });
  const { start, budget, below } = windowAround(filtered.length, selectedIndex);
  const visible = filtered.slice(start, start + budget);
  const selected = filtered[selectedIndex];
  const detail = error ?? (selected ? `${selected.description}  ·  ${selected.values.join(" / ")}` : void 0);
  const list =
    items.length === 0
      ? jsx(Text, { children: theme.muted("No settings are available.") })
      : filtered.length === 0
      ? jsx(Text, { children: theme.muted("No settings matched the search.") })
      : jsx(Box, {
          flexDirection: "column",
          children: visible.map((item, index) => {
            const isSelected = start + index === selectedIndex;
            const labelText = truncate(item.label, SETTINGS_LABEL_WIDTH - 1).padEnd(SETTINGS_LABEL_WIDTH);
            return jsxs(
              Box,
              {
                children: [
                  jsx(Box, { width: 2, children: jsx(Text, { children: isSelected ? theme.color("accent", "›") : " " }) }),
                  jsx(Box, {
                    width: SETTINGS_LABEL_WIDTH,
                    children: jsx(Text, { bold: isSelected, children: theme.color("text", labelText) })
                  }),
                  jsx(Text, { children: paintValue(theme, item.value) })
                ]
              },
              item.id
            );
          })
        });
  return jsx(BoardShell, {
    theme,
    title: "Settings",
    query,
    placeholder: "Search settings…",
    below,
    hint: "Type to filter  ·  ↑/↓ select  ·  ←/→ or ↵ change  ·  Ctrl+U clear  ·  Esc close",
    detail,
    children: list
  });
}

function modelMatches(model: Model<any>, query: string) {
  return matchesSearchQuery(`${model.provider} ${model.id} ${model.name ?? ""}`, query);
}

export interface ModelBoardProps {
  readonly theme: InkThemeAdapter;
  readonly models: readonly Model<any>[];
  readonly onClose: () => void;
  readonly onSelect: (model: Model<any>) => void | Promise<void>;
  readonly search?: string;
}

export function ModelBoard({ theme, models, onClose, onSelect, search }: ModelBoardProps) {
  const [query, setQuery] = useState(search ?? "");
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => setQuery(search ?? ""), [search]);
  // Authentication belongs to the injected service/parent, never a guessed HOME path.
  const available = models;
  const filtered = useMemo(() => available.filter((model) => modelMatches(model, query)), [available, query]);
  useEffect(() => setSelectedIndex(0), [query]);
  useEffect(() => {
    if (selectedIndex >= filtered.length) setSelectedIndex(0);
  }, [filtered.length, selectedIndex]);
  useInput((input, key) => {
    if (key.escape) return onClose();
    if (key.upArrow) return setSelectedIndex((c) => wrapSelectionIndex(c, -1, filtered.length));
    if (key.downArrow) return setSelectedIndex((c) => wrapSelectionIndex(c, 1, filtered.length));
    if (key.backspace || key.delete) return setQuery((c) => c.slice(0, -1));
    if (key.ctrl && input === "u") return setQuery("");
    if (key.return) {
      const model = filtered[selectedIndex];
      if (model) void onSelect(model);
      return;
    }
    if (!key.ctrl && !key.meta && input) setQuery((c) => c + input);
  });
  const { start, budget, below } = windowAround(filtered.length, selectedIndex);
  const visible = filtered.slice(start, start + budget);
  const list =
    filtered.length === 0
      ? jsx(Text, {
          children: theme.muted(
            available.length === 0
              ? "No models available — sign in with a provider key or run /login to use the server tier."
              : "No models matched the search."
          )
        })
      : jsx(Box, {
          flexDirection: "column",
          children: visible.map((model, index) => {
            const isSelected = start + index === selectedIndex;
            return jsxs(
              Box,
              {
                children: [
                  jsx(Box, { width: 2, children: jsx(Text, { children: isSelected ? theme.color("accent", "›") : " " }) }),
                  jsx(Text, { bold: isSelected, children: theme.color("text", model.id) }),
                  model.name ? jsx(Text, { children: theme.dim(`  ${model.name}`) }) : null,
                  jsx(Text, { children: theme.dim(`  ${model.provider}`) })
                ]
              },
              `${model.provider}/${model.id}`
            );
          })
        });
  return jsx(BoardShell, {
    theme,
    title: "Models",
    query,
    placeholder: "Search models by provider, id, or name…",
    below,
    hint: "Type to filter  ·  ↑/↓ select  ·  ↵ choose  ·  Ctrl+U clear  ·  Esc close",
    children: list
  });
}