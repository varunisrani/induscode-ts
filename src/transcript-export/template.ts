/**
 * Template — the HTML page shell, inlined styles, and client renderer for the
 * self-contained transcript export.
 */

export const SHELL_SLOTS: Readonly<Record<string, string>> = Object.freeze({
  themeVars: "THEME_VARS",
  pageSurface: "PAGE_SURFACE",
  cardSurface: "CARD_SURFACE",
  noteSurface: "NOTE_SURFACE",
  styles: "STYLES",
  script: "SCRIPT",
  payload: "PAYLOAD",
  markedLib: "MARKED_LIB",
  highlightLib: "HIGHLIGHT_LIB",
});

const PAGE_STYLES = `
:root { color-scheme: dark light; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--x-page-surface);
  color: var(--x-ink);
  font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.xscript {
  max-width: 56rem;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.xscript-head {
  border-bottom: 1px solid var(--x-border);
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
}
.xscript-head h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.xscript-head .xscript-meta {
  margin-top: 0.35rem;
  color: var(--x-ink-muted);
  font-size: 0.85rem;
}
.turn {
  background: var(--x-card-surface);
  border: 1px solid var(--x-border);
  border-radius: 0.65rem;
  padding: 1rem 1.15rem;
  overflow: hidden;
}
.turn[data-role="user"] { border-left: 3px solid var(--x-user-role); }
.turn[data-role="agent"] { border-left: 3px solid var(--x-agent-role); }
.turn[data-role="tool"] { border-left: 3px solid var(--x-tool-role); }
.turn-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.6rem;
  color: var(--x-ink-muted);
}
.turn[data-role="user"] .turn-tag { color: var(--x-user-role); }
.turn[data-role="agent"] .turn-tag { color: var(--x-agent-role); }
.turn[data-role="tool"] .turn-tag { color: var(--x-tool-role); }
.turn-body { word-break: break-word; }
.turn-body > :first-child { margin-top: 0; }
.turn-body > :last-child { margin-bottom: 0; }
.turn-body a { color: var(--x-accent); text-decoration: none; }
.turn-body a:hover { text-decoration: underline; }
.turn-body p { margin: 0.6rem 0; }
.turn-body img { max-width: 100%; border-radius: 0.4rem; }
.turn-body code {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
  font-size: 0.88em;
  background: var(--x-note-surface);
  padding: 0.1em 0.35em;
  border-radius: 0.3rem;
}
.turn-body pre {
  background: var(--x-note-surface);
  border: 1px solid var(--x-border);
  border-radius: 0.5rem;
  padding: 0.9rem 1rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}
.turn-body pre code { background: none; padding: 0; }
.tool-frame {
  font-family: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
  font-size: 0.85rem;
  background: var(--x-note-surface);
  border: 1px solid var(--x-border);
  border-radius: 0.5rem;
  padding: 0.85rem 1rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  white-space: pre-wrap;
}
.aside-note {
  background: var(--x-note-surface);
  border: 1px dashed var(--x-border);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--x-ink-muted);
  font-size: 0.9rem;
}
.sgr-bold { font-weight: 700; }
.sgr-dim { opacity: 0.72; }
.sgr-italic { font-style: italic; }
.sgr-underline { text-decoration: underline; }
.sgr-strike { text-decoration: line-through; }
.sgr-underline.sgr-strike { text-decoration: underline line-through; }
.sgr-blink { animation: x-blink 1.1s steps(2, start) infinite; }
.sgr-hidden { visibility: hidden; }
@keyframes x-blink { 50% { opacity: 0; } }
.xhl-keyword { color: var(--x-accent); }
.xhl-string { color: var(--x-user-role); }
.xhl-comment { color: var(--x-ink-muted); font-style: italic; }
.xhl-number, .xhl-literal { color: var(--x-tool-role); }
`.trim();

const CLIENT_SCRIPT = `
(function () {
  "use strict";
  var root = document.getElementById("xscript-root");
  if (!root) return;

  var raw;
  try {
    raw = JSON.parse(decodeURIComponent(escape(atob(window.__XSCRIPT_PAYLOAD__ || ""))));
  } catch (err) {
    root.textContent = "Unable to decode transcript payload.";
    return;
  }

  function hl(code, lang) {
    try {
      if (lang && window.hljs && window.hljs.getLanguage(lang)) {
        return window.hljs.highlight(code, { language: lang }).value;
      }
      if (window.hljs) return window.hljs.highlightAuto(code).value;
    } catch (e) {}
    return null;
  }

  if (window.marked && window.marked.setOptions) {
    window.marked.setOptions({
      gfm: true,
      breaks: false,
      highlight: function (code, lang) {
        var out = hl(code, lang);
        return out == null ? code : out;
      },
    });
  }

  function md(text) {
    try {
      if (window.marked && window.marked.parse) {
        return window.marked.parse(text, { async: false });
      }
    } catch (e) {}
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  function renderTurn(turn) {
    if (turn.kind === "note") {
      var note = el("div", "aside-note");
      note.innerHTML = turn.html != null ? turn.html : md(turn.text || "");
      return note;
    }
    var card = el("section", "turn");
    card.setAttribute("data-role", turn.role || "agent");
    var tag = el("span", "turn-tag");
    tag.textContent = turn.label || turn.role || "";
    card.appendChild(tag);
    var body = el("div", "turn-body");
    if (turn.html != null) {
      body.innerHTML = turn.html;
    } else if (turn.frame) {
      var frame = el("div", "tool-frame");
      frame.innerHTML = turn.frame;
      body.appendChild(frame);
    } else {
      body.innerHTML = md(turn.text || "");
    }
    card.appendChild(body);
    return card;
  }

  var turns = Array.isArray(raw.turns) ? raw.turns : [];
  for (var i = 0; i < turns.length; i++) {
    root.appendChild(renderTurn(turns[i]));
  }
})();
`.trim();

const PAGE_SHELL = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Session Transcript</title>
<style>
:root {
{{THEME_VARS}}
  --x-page-surface: {{PAGE_SURFACE}};
  --x-card-surface: {{CARD_SURFACE}};
  --x-note-surface: {{NOTE_SURFACE}};
}
{{STYLES}}
</style>
</head>
<body>
<main class="xscript">
  <header class="xscript-head">
    <h1>Session Transcript</h1>
    <div class="xscript-meta">Self-contained HTML export</div>
  </header>
  <div id="xscript-root"></div>
</main>
<script>
/* {{MARKED_LIB}} */
</script>
<script>
/* {{HIGHLIGHT_LIB}} */
</script>
<script>
window.__XSCRIPT_PAYLOAD__ = "{{PAYLOAD}}";
</script>
<script>
{{SCRIPT}}
</script>
</body>
</html>
`;

export { PAGE_STYLES, CLIENT_SCRIPT, PAGE_SHELL };

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function fill(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  let out = template;
  for (const token of Object.values(SHELL_SLOTS)) {
    const value = values[token] ?? "";
    const marker = new RegExp(`\\{\\{${escapeRegExp(token)}\\}\\}`, "g");
    out = out.replace(marker, () => value);
  }
  return out;
}