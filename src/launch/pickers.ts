/**
 * Launch pickers — `pickResumeTarget` and `browseSettings`.
 */
import { createInterface } from "node:readline/promises";
import { createElement } from "indusagi/react-host";
import { render } from "indusagi/react-host/ink";
import { StartupSessionPicker } from "indusagi/react-ink";
import type {
  ResumeFault,
  ResumeRef,
  SessionLoader,
  SettingsBrowseOptions,
} from "./contract.js";

export interface ResumeDeps {
  isInteractive(): boolean;
  mountPicker(sessions: readonly ResumeRef[], totalCount: number): Promise<ResumeRef | null>;
}

/**
 * The live {@link ResumeDeps}: a real TTY probe and the Ink picker mount.
 */
export function defaultResumeDeps(): ResumeDeps {
  return {
    isInteractive(): boolean {
      return Boolean(process.stdin.isTTY && process.stdout.isTTY);
    },
    mountPicker(sessions, totalCount): Promise<ResumeRef | null> {
      const byPath = new Map(sessions.map((s) => [s.path, s]));
      return new Promise<ResumeRef | null>((resolve, reject) => {
        let settled = false;
        const settle = (value: ResumeRef | null): void => {
          if (settled) return;
          settled = true;
          instance.unmount();
          resolve(value);
        };
        let instance: { unmount: () => void; waitUntilExit: () => Promise<void> };
        try {
          instance = render(
            createElement(StartupSessionPicker, {
              sessions: [...sessions],
              totalCount,
              onClose: () => settle(null),
              onSelect: (session: ResumeRef) => settle(byPath.get(session.path) ?? null),
            }),
          );
        } catch (cause) {
          reject(cause);
          return;
        }
        void instance.waitUntilExit().then(() => {
          if (!settled) {
            settled = true;
            resolve(null);
          }
        });
      });
    },
  };
}

/**
 * Merge two session lists into one newest-first list de-duplicated by path.
 */
export function mergeSessions(
  current: readonly ResumeRef[],
  all: readonly ResumeRef[],
): ResumeRef[] {
  const byPath = new Map<string, ResumeRef>();
  for (const session of [...current, ...all]) {
    if (!byPath.has(session.path)) byPath.set(session.path, session);
  }
  return [...byPath.values()].sort((a, b) => b.lastModified - a.lastModified);
}

export interface ResumeOutcome {
  readonly path: string | null;
  readonly fault?: ResumeFault;
}

/**
 * Choose a session to resume.
 */
export async function pickResumeTarget(
  loadCurrent: SessionLoader,
  loadAll: SessionLoader,
  deps: ResumeDeps = defaultResumeDeps(),
): Promise<ResumeOutcome> {
  let current: ResumeRef[];
  let all: ResumeRef[];
  try {
    [current, all] = await Promise.all([loadCurrent(), loadAll()]);
  } catch (cause) {
    return {
      path: null,
      fault: {
        message: "Failed to load resumable sessions.",
        cause,
      },
    };
  }
  const sessions = mergeSessions(current, all);
  if (sessions.length === 0) return { path: null };
  if (!deps.isInteractive()) {
    return { path: sessions[0].path };
  }
  try {
    const chosen = await deps.mountPicker(sessions, sessions.length);
    return { path: chosen === null ? null : chosen.path };
  } catch (cause) {
    return {
      path: null,
      fault: {
        message: "The session picker failed to start.",
        cause,
      },
    };
  }
}

export interface SettingsBrowseIo {
  print(line: string): void;
  pause(prompt: string): Promise<void>;
}

export function defaultSettingsBrowseIo(): SettingsBrowseIo {
  return {
    print(line: string): void {
      process.stdout.write(line.endsWith("\n") ? line : `${line}\n`);
    },
    async pause(prompt: string): Promise<void> {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        await rl.question(prompt);
      } finally {
        rl.close();
      }
    },
  };
}

function renderSection(title: string, paths: readonly string[]): string[] {
  if (paths.length === 0) return [`${title}: (none)`];
  return [`${title}:`, ...paths.map((path) => `  - ${path}`)];
}

/**
 * Build the entire settings listing as an array of lines.
 */
export function renderSettingsListing(opts: SettingsBrowseOptions): string[] {
  const lines: string[] = [];
  lines.push("Configuration");
  lines.push(`  Working directory: ${opts.cwd}`);
  lines.push(`  Profile directory: ${opts.profileDir}`);
  lines.push("");
  lines.push("Settings");
  lines.push(`  Default model: ${opts.settings.defaultModel ?? "(unset)"}`);
  lines.push(
    `  System prompt: ${opts.settings.systemPrompt !== undefined ? "(custom)" : "(default)"}`,
  );
  const serverCount = opts.settings.mcpServers?.length ?? 0;
  lines.push(`  MCP servers: ${serverCount}`);
  lines.push("");
  const categories = Object.keys(opts.resolvedPaths).sort();
  if (categories.length === 0) {
    lines.push("Resources: (none discovered)");
  } else {
    lines.push("Resources");
    for (const category of categories) {
      for (const line of renderSection(`  ${category}`, opts.resolvedPaths[category])) {
        lines.push(line);
      }
    }
  }
  return lines;
}

/**
 * Print the settings / resource listing and wait for the user to dismiss it.
 */
export async function browseSettings(
  opts: SettingsBrowseOptions,
  io: SettingsBrowseIo = defaultSettingsBrowseIo(),
): Promise<void> {
  for (const line of renderSettingsListing(opts)) io.print(line);
  io.print("");
  await io.pause("Press Enter to continue. ");
}