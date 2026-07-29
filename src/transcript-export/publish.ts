/**
 * publishTranscript — render a session transcript to a standalone, self-contained
 * HTML document.
 */
import hljs from "highlight.js";
import { marked } from "marked";
import { briefingFault, type ExportTheme } from "../briefing/contract.js";
import { paintSgr } from "./sgr.js";
import { CLIENT_SCRIPT, fill, PAGE_SHELL, PAGE_STYLES, SHELL_SLOTS } from "./template.js";
import { createThemeBridge, DefaultThemeBridge } from "./theme-bridge.js";

interface TextPart {
  type: "text";
  text: string;
}

interface ImagePart {
  type: "image";
  data: string;
  mimeType: string;
}

interface ThinkingPart {
  type: "thinking";
  thinking: string;
}

interface ToolCallPart {
  type: "toolCall";
  id: string;
  name: string;
  arguments: unknown;
}

type ContentPart = TextPart | ImagePart | ThinkingPart | ToolCallPart | { type: string };

export interface TranscriptEntry {
  readonly role: "user" | "assistant" | "tool" | "system" | "condense" | "note";
  readonly message: {
    readonly content: string | readonly ContentPart[];
    readonly toolCallId?: string;
    readonly toolName?: string;
  };
}

export interface TranscriptWidget {
  readonly callId: string;
  readonly html: string;
}

export interface PublishOptions {
  readonly theme?: ExportTheme;
  readonly title?: string;
  readonly widgets?: readonly TranscriptWidget[];
}

const MARKED_LICENSE = [
  "marked \u2014 https://github.com/markedjs/marked",
  "Copyright (c) 2018+, MarkedJS",
  "Copyright (c) 2011-2018, Christopher Jeffrey",
  "Released under the MIT License.",
].join("\n");

const HIGHLIGHT_LICENSE = [
  "highlight.js \u2014 https://github.com/highlightjs/highlight.js",
  "Copyright (c) 2006, Ivan Sagalaev. All rights reserved.",
  "Released under the BSD-3-Clause License.",
].join("\n");

const ROLE_LABEL: Readonly<Record<TranscriptEntry["role"], string>> = {
  user: "You",
  assistant: "Assistant",
  tool: "Tool",
  system: "System",
  condense: "Summary",
  note: "Note",
};

function escapeHtml2(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hasAnsi(text: string): boolean {
  return /\x1B\[/.test(text);
}

function highlightCode(code: string, language?: string): string {
  try {
    if (language && hljs.getLanguage(language)) {
      return hljs.highlight(code, { language }).value;
    }
    return hljs.highlightAuto(code).value;
  } catch {
    return escapeHtml2(code);
  }
}

function configuredMarked(): typeof marked {
  marked.setOptions({ gfm: true, breaks: false, async: false });
  marked.use({
    renderer: {
      code(token: string | { text: string; lang?: string }): string {
        const text = typeof token === "string" ? token : token.text;
        const lang =
          typeof token === "string" ? undefined : (token.lang || "").trim() || undefined;
        const highlighted = highlightCode(text, lang);
        const cls = lang ? ` class="language-${escapeHtml2(lang)}"` : "";
        return `<pre><code${cls}>${highlighted}</code></pre>`;
      },
    },
  });
  return marked;
}

function renderMarkdown(md: typeof marked, source: string): string {
  const out = md.parse(source, { async: false });
  return typeof out === "string" ? out : "";
}

function renderImage(part: ImagePart): string {
  const src = `data:${escapeHtml2(part.mimeType)};base64,${part.data}`;
  return `<img alt="attached image" src="${src}" />`;
}

function renderToolCall(name: string, args: unknown): string {
  let payload: string;
  try {
    payload = JSON.stringify(args, null, 2);
  } catch {
    payload = String(args);
  }
  return `<div class="tool-frame"><strong>${escapeHtml2(name)}</strong>\n${escapeHtml2(payload)}</div>`;
}

function renderToolText(text: string): string {
  const inner = hasAnsi(text) ? paintSgr(text) : escapeHtml2(text);
  return `<pre class="tool-frame">${inner}</pre>`;
}

function partsOf(content: string | readonly ContentPart[]): readonly ContentPart[] {
  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }
  return content;
}

interface RenderedTurn {
  readonly kind: "turn" | "note";
  readonly role: TranscriptEntry["role"];
  readonly label: string;
  readonly html: string;
}

function renderEntry(
  entry: TranscriptEntry,
  md: typeof marked,
  widgets: Map<string, TranscriptWidget>,
): RenderedTurn {
  const role = entry.role;
  const label = ROLE_LABEL[role] ?? role;
  if (role === "tool" && entry.message.toolCallId !== undefined) {
    const widget = widgets.get(entry.message.toolCallId);
    if (widget !== undefined) {
      return { kind: "turn", role, label, html: widget.html };
    }
  }
  const fragments: string[] = [];
  for (const part of partsOf(entry.message.content)) {
    switch (part.type) {
      case "text":
        if (role === "tool") {
          fragments.push(renderToolText((part as TextPart).text));
        } else {
          fragments.push(renderMarkdown(md, (part as TextPart).text));
        }
        break;
      case "image":
        fragments.push(renderImage(part as ImagePart));
        break;
      case "thinking":
        fragments.push(
          `<div class="aside-note">${escapeHtml2((part as ThinkingPart).thinking)}</div>`,
        );
        break;
      case "toolCall": {
        const tc = part as ToolCallPart;
        fragments.push(renderToolCall(tc.name, tc.arguments));
        break;
      }
      default:
        break;
    }
  }
  const html = fragments.join("\n");
  const kind: "turn" | "note" = role === "system" || role === "condense" ? "note" : "turn";
  return { kind, role, label, html };
}

function toBase64(text: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(text, "utf-8").toString("base64");
  }
  const bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_m, h) =>
    String.fromCharCode(parseInt(h, 16)),
  );
  return btoa(bytes);
}

function themeVarsBlock(bridge: DefaultThemeBridge): string {
  const vars = bridge.toCssVars();
  const hyphenate = (name: string): string =>
    name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return Object.entries(vars)
    .map(([token, value]) => `  --x-${hyphenate(token)}: ${value};`)
    .join("\n");
}

export function publishTranscript(
  entries: readonly TranscriptEntry[],
  opts: PublishOptions = {},
): string {
  try {
    const bridge = opts.theme ? createThemeBridge(opts.theme) : createThemeBridge();
    const md = configuredMarked();
    const widgetIndex = new Map<string, TranscriptWidget>(
      (opts.widgets ?? []).map((w) => [w.callId, w]),
    );
    const turns = entries.map((entry) => renderEntry(entry, md, widgetIndex));
    const title = opts.title ?? "Session Transcript";
    const payloadJson = JSON.stringify({
      title,
      turns: turns.map((t) => ({
        kind: t.kind === "note" ? "note" : undefined,
        role: t.role,
        label: t.label,
        html: t.html,
      })),
    });
    const payload = toBase64(payloadJson);
    const slots: Record<string, string> = {
      [SHELL_SLOTS.themeVars]: themeVarsBlock(bridge),
      [SHELL_SLOTS.pageSurface]: bridge.theme.pageSurface,
      [SHELL_SLOTS.cardSurface]: bridge.theme.cardSurface,
      [SHELL_SLOTS.noteSurface]: bridge.theme.noteSurface,
      [SHELL_SLOTS.styles]: PAGE_STYLES,
      [SHELL_SLOTS.script]: CLIENT_SCRIPT,
      [SHELL_SLOTS.payload]: payload,
      [SHELL_SLOTS.markedLib]: MARKED_LICENSE,
      [SHELL_SLOTS.highlightLib]: HIGHLIGHT_LICENSE,
    };
    return fill(PAGE_SHELL, slots);
  } catch (cause) {
    throw briefingFault("publish", "Failed to render the HTML transcript.", cause);
  }
}