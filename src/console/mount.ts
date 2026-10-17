/**
 * Console mount — render the interactive surface and resolve on exit.
 */
import { createElement } from "indusagi/react-host";
import { render } from "indusagi/react-host/ink";
import { TerminalConsole } from "./components/TerminalConsole.js";
import { DEFAULT_SLASH_REGISTRY } from "./slash/index.js";
import { resolveTheme } from "./theme/index.js";
import type { OverlayServices, SessionConductor, SlashRegistry } from "./contract.js";

export const SYNC_OUTPUT_BEGIN = "\x1b[?2026h";
export const SYNC_OUTPUT_END = "\x1b[?2026l";

function supportsSynchronizedOutput(stream: NodeJS.WriteStream): boolean {
  if (!stream.isTTY || process.env["INDUS_TUI_SYNC_OUTPUT"] === "0") return false;
  const term = process.env["TERM"] ?? "";
  return process.env["TMUX"] === undefined && process.env["STY"] === undefined &&
    !term.startsWith("screen") && !term.startsWith("tmux");
}

/** Wrap complete Ink writes in DEC mode 2026 so terminals paint each frame atomically. */
export function synchronizedOutputStream(
  stream: NodeJS.WriteStream,
  enabled = supportsSynchronizedOutput(stream)
): NodeJS.WriteStream {
  if (!enabled) return stream;
  const write = (chunk: string | Uint8Array, encodingOrCallback?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void) => {
    const framed = typeof chunk === "string"
      ? `${SYNC_OUTPUT_BEGIN}${chunk}${SYNC_OUTPUT_END}`
      : Buffer.concat([Buffer.from(SYNC_OUTPUT_BEGIN), Buffer.from(chunk), Buffer.from(SYNC_OUTPUT_END)]);
    if (typeof encodingOrCallback === "function") return stream.write(framed, encodingOrCallback);
    return stream.write(framed, encodingOrCallback, callback);
  };
  return new Proxy(stream, {
    get(target, property) {
      if (property === "write") return write;
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

/**
 * Options for {@link mountConsole}.
 */
export interface MountConsoleOptions {
  readonly scheme?: string | null;
  readonly slash?: SlashRegistry;
  readonly initialInput?: string;
  readonly initialImages?: readonly string[];
  readonly verbose?: boolean;
  readonly services?: OverlayServices;
}

/**
 * The handle a {@link mountConsole} call resolves with once the surface exits.
 */
export interface MountResult {
  readonly clean: boolean;
}

/**
 * Render the interactive console for a session and resolve when it exits.
 */
export async function mountConsole(
  conductor: SessionConductor,
  opts: MountConsoleOptions = {}
): Promise<MountResult> {
  const theme = resolveTheme(opts.scheme ?? null);
  const slash = opts.slash ?? DEFAULT_SLASH_REGISTRY;
  let exited = false;
  const props = {
    conductor,
    theme,
    slash,
    initialInput: opts.initialInput,
    initialImages: opts.initialImages,
    verbose: opts.verbose,
    services: opts.services,
    onExit: () => {
      exited = true;
      instance.unmount();
    }
  };
  const wasRaw = process.stdin.isRaw === true;
  const stdout = synchronizedOutputStream(process.stdout);
  const instance = render(createElement(TerminalConsole, props), { exitOnCtrlC: false, stdout });
  try {
    await instance.waitUntilExit();
    return { clean: exited };
  } finally {
    // Ink's passive input-hook cleanup may run after waitUntilExit resolves.
    // Restore the terminal before handing control back to the caller.
    instance.unmount();
    if (process.stdin.isTTY) process.stdin.setRawMode(wasRaw);
    if (process.stdout.isTTY) process.stdout.write("\x1b[?25h");
  }
}