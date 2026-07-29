/**
 * Banner — the "IndusCode Saffron" masthead the console renders above the transcript.
 */
import { Fragment, jsx, jsxs } from "indusagi/react-host/jsx-runtime";
import { Box, Text } from "indusagi/react-host/ink";
import { ChangelogBlock } from "indusagi/react-ink";
import { homedir } from "node:os";
import { basename } from "node:path";
import type { InkThemeAdapter } from "indusagi/react-ink";
import type { StartupChangelog, StartupMap, StartupNotice } from "../startup.js";
import { MASCOTS, WHATS_NEW, pickWelcomeVariant, mascotRows, type MascotFace } from "./welcome.js";
import { welcomeLine } from "./banner-sweep.js";

const BRAND = "IndusCode";
const COMPACT_EMBLEM = "▛▜▙▟";

const WORDMARK_ROWS: readonly string[] = [
  "██╗███╗   ██╗██████╗ ██╗   ██╗███████╗     ██████╗ ██████╗ ██████╗ ███████╗",
  "██║████╗  ██║██╔══██╗██║   ██║██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝",
  "██║██╔██╗ ██║██║  ██║██║   ██║███████╗    ██║     ██║   ██║██║  ██║███████╗",
  "██║██║╚██╗██║██║  ██║██║   ██║╚════██║    ██║     ██║   ██║██║  ██║╚════██║",
  "██║██║ ╚████║██████╔╝╚██████╔╝███████║    ╚██████╗╚██████╔╝██████╔╝███████║",
  "╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚══════╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝"
];

function StartupNotices({ theme, notices }: { theme: InkThemeAdapter; notices: readonly StartupNotice[] }) {
  if (notices.length === 0) return null;
  return jsx(Box, {
    flexDirection: "column",
    marginBottom: 1,
    children: notices.map((notice, index) => jsx(Text, { children: paintNotice(theme, notice) }, index))
  });
}

function paintNotice(theme: InkThemeAdapter, notice: StartupNotice) {
  switch (notice.kind) {
    case "error":
      return theme.color("error", notice.text);
    case "warning":
      return theme.color("warning", notice.text);
    case "info":
    default:
      return theme.muted(notice.text);
  }
}

function StartupChangelogBlock({ theme, changelog }: { theme: InkThemeAdapter; changelog: StartupChangelog }) {
  if (changelog.mode === "full" && changelog.markdown !== void 0) {
    return jsx(ChangelogBlock, { markdown: changelog.markdown, theme, title: "What is new" });
  }
  if (changelog.mode === "condensed") {
    return jsxs(Box, {
      marginTop: 1,
      children: [
        jsx(Text, { children: theme.muted(`Updated to v${changelog.version}. Use `) }),
        jsx(Text, { children: theme.color("accent", "/changelog") }),
        jsx(Text, { children: theme.muted(" to view the full changelog.") })
      ]
    });
  }
  return null;
}

function WelcomeLine({ theme, name, tone = "accent" }: { theme: InkThemeAdapter; name?: string; tone?: "accent" | "muted" }) {
  const paint = (text: string) => (tone === "muted" ? theme.muted(text) : theme.color("accent", text));
  const line = welcomeLine(name);
  if (name !== void 0 && line !== "Welcome back!") {
    return jsxs(Box, {
      children: [
        jsx(Text, { children: paint("Welcome back, ") }),
        jsx(Text, { bold: true, children: name.trim() }),
        jsx(Text, { children: paint("!") })
      ]
    });
  }
  return jsx(Box, { children: jsx(Text, { children: paint(line) }) });
}

function ShellLine({ theme, workspace, branch }: { theme: InkThemeAdapter; workspace: string; branch?: string | null }) {
  const dir = basename(workspace);
  return jsxs(Box, {
    children: [
      jsx(Text, { children: theme.color("customMessage", "➜") }),
      jsx(Text, { children: "  " }),
      jsx(Text, { bold: true, children: theme.color("text", dir) }),
      branch !== void 0 && branch !== null && branch.length > 0
        ? jsxs(Fragment, {
            children: [
              jsx(Text, { children: " " }),
              jsx(Text, { children: theme.color("accent", "git:(") }),
              jsx(Text, { children: theme.color("customMessage", branch) }),
              jsx(Text, { children: theme.color("accent", ")") })
            ]
          })
        : null,
      jsx(Text, { children: theme.dim("  indus") })
    ]
  });
}

function Wordmark({ theme }: { theme: InkThemeAdapter }) {
  return jsx(Box, {
    flexDirection: "column",
    children: WORDMARK_ROWS.map((line, index) => jsx(Text, { children: theme.color("accent", line) }, index))
  });
}

function SessionFact({ theme, label, value }: { theme: InkThemeAdapter; label: string; value: string }) {
  return jsxs(Box, {
    children: [
      jsx(Text, { children: theme.dim(`${label.padEnd(7)} `) }),
      jsx(Text, { children: theme.muted(value) })
    ]
  });
}

function paintMascot(theme: InkThemeAdapter, tone: string, text: string) {
  switch (tone) {
    case "head":
      return theme.color("accent", text);
    case "mouth":
      return theme.color("customMessage", text);
    case "eye":
    case "feet":
    default:
      return theme.dim(text);
  }
}

function Mascot({ theme, face }: { theme: InkThemeAdapter; face: MascotFace }) {
  return jsx(Box, {
    flexDirection: "column",
    alignItems: "center",
    marginY: 1,
    children: mascotRows(face).map((row, rowIndex) =>
      jsx(
        Box,
        {
          children: row.map((seg, segIndex) =>
            jsx(Text, { children: paintMascot(theme, seg.tone, seg.text) }, segIndex)
          )
        },
        rowIndex
      )
    )
  });
}

function shortenWorkspace(workspace: string): string {
  const home = homedir();
  if (home.length > 0 && workspace.startsWith(home)) {
    return `~${workspace.slice(home.length)}`;
  }
  return workspace;
}

export interface BannerProps {
  readonly theme: InkThemeAdapter;
  readonly modelId: string;
  readonly workspace: string;
  readonly version: string;
  readonly started?: boolean;
  readonly branch?: string | null;
  readonly verbose?: boolean;
  readonly quiet?: boolean;
  readonly compact?: boolean;
  readonly name?: string;
  readonly sweep?: boolean;
  readonly variantSeed?: number;
  readonly whatsNew?: readonly string[];
  readonly startup?: StartupMap;
  readonly notices?: readonly StartupNotice[];
  readonly changelog?: StartupChangelog;
}

export function Banner(props: BannerProps) {
  const {
    theme,
    modelId,
    workspace,
    version,
    started,
    branch,
    quiet,
    compact,
    name,
    variantSeed,
    whatsNew,
    notices,
    changelog
  } = props;
  const noticeList = notices ?? [];
  if (quiet || compact) {
    return jsxs(Box, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        jsx(StartupNotices, { theme, notices: noticeList }),
        jsxs(Box, {
          children: [
            compact
              ? jsxs(Fragment, {
                  children: [
                    jsx(Text, { children: theme.color("accent", COMPACT_EMBLEM.slice(0, 2)) }),
                    jsx(Text, { children: theme.color("customMessage", COMPACT_EMBLEM.slice(2)) }),
                    jsx(Text, { children: "  " })
                  ]
                })
              : null,
            jsx(Text, { bold: true, children: theme.color("accent", BRAND) }),
            jsx(Text, { children: "  " }),
            jsx(Text, { children: theme.muted(`v${version}`) }),
            jsx(Text, { children: "  " }),
            jsx(Text, { children: theme.dim(modelId) })
          ]
        }),
        jsx(WelcomeLine, { theme, name, tone: "muted" }),
        changelog ? jsx(StartupChangelogBlock, { theme, changelog }) : null
      ]
    });
  }
  if (started) {
    return jsxs(Box, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        jsx(StartupNotices, { theme, notices: noticeList }),
        jsx(ShellLine, { theme, workspace, branch }),
        jsx(Box, { marginTop: 1, children: jsx(Wordmark, { theme }) }),
        jsxs(Box, {
          marginTop: 1,
          flexDirection: "column",
          children: [
            jsxs(Box, {
              children: [
                jsx(Text, { bold: true, children: theme.color("accent", "indus console") }),
                jsx(Text, { children: "  " }),
                jsx(Text, { children: theme.dim(`v${version}`) })
              ]
            }),
            jsx(WelcomeLine, { theme, name, tone: "accent" })
          ]
        }),
        jsxs(Box, {
          flexDirection: "column",
          borderStyle: "round",
          borderColor: theme.colors["accent"],
          paddingX: 1,
          marginTop: 1,
          children: [
            jsx(Text, { bold: true, children: theme.color("accent", "Session") }),
            jsx(SessionFact, { theme, label: "model", value: modelId }),
            jsx(SessionFact, { theme, label: "cwd", value: shortenWorkspace(workspace) })
          ]
        }),
        changelog ? jsx(StartupChangelogBlock, { theme, changelog }) : null
      ]
    });
  }
  const variant = pickWelcomeVariant(variantSeed ?? 0);
  const greeting = welcomeLine(name);
  const news = whatsNew && whatsNew.length > 0 ? whatsNew : WHATS_NEW;
  const metaLine = modelId;
  return jsxs(Box, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      jsx(StartupNotices, { theme, notices: noticeList }),
      jsxs(Box, {
        flexDirection: "column",
        borderStyle: "round",
        borderColor: theme.colors["accent"],
        paddingX: 2,
        paddingY: 1,
        children: [
          jsxs(Box, {
            children: [
              jsx(Text, { children: theme.color("customMessage", "● ") }),
              jsx(Text, { bold: true, children: theme.color("accent", `${BRAND} `) }),
              jsx(Text, { children: theme.dim(`v${version}`) })
            ]
          }),
          jsxs(Box, {
            marginTop: 1,
            flexDirection: "row",
            children: [
              jsxs(Box, {
                flexDirection: "column",
                alignItems: "center",
                width: 32,
                flexShrink: 0,
                marginRight: 2,
                children: [
                  jsx(Text, { bold: true, children: theme.color("text", greeting) }),
                  jsx(Mascot, { theme, face: variant.mascot }),
                  jsx(Text, { children: theme.dim(metaLine) }),
                  jsx(Text, { children: theme.dim(shortenWorkspace(workspace)) })
                ]
              }),
              jsxs(Box, {
                flexDirection: "column",
                flexGrow: 1,
                borderStyle: "single",
                borderColor: theme.colors["borderMuted"],
                borderTop: false,
                borderRight: false,
                borderBottom: false,
                paddingLeft: 2,
                children: [
                  jsx(Text, { bold: true, children: theme.color("accent", "Tips for getting started") }),
                  jsx(Text, { children: theme.color("text", variant.tip) }),
                  jsx(Box, { marginTop: 1, children: jsx(Text, { bold: true, children: theme.color("accent", "What's new") }) }),
                  news.map((line, index) =>
                    jsxs(Box, {
                      flexDirection: "row",
                      children: [
                        jsx(Box, { width: 2, flexShrink: 0, children: jsx(Text, { children: theme.color("customMessage", "▸") }) }),
                        jsx(Box, { flexGrow: 1, children: jsx(Text, { children: theme.color("text", line) }) })
                      ]
                    }, index)
                  ),
                  jsx(Box, { marginTop: 1, children: jsx(Text, { italic: true, children: theme.muted("/release-notes for more") }) })
                ]
              })
            ]
          })
        ]
      }),
      changelog ? jsx(StartupChangelogBlock, { theme, changelog }) : null
    ]
  });
}
// Keep MASCOTS imported as a side-effect of this file even if not used directly
void MASCOTS;