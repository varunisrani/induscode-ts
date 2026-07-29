/**
 * Console mount — render the interactive surface and resolve on exit.
 */
import { createElement } from "indusagi/react-host";
import { render } from "indusagi/react-host/ink";
import { TerminalConsole } from "./components/TerminalConsole.js";
import { DEFAULT_SLASH_REGISTRY } from "./slash/index.js";
import { resolveTheme } from "./theme/index.js";
import type { OverlayServices, SessionConductor, SlashRegistry } from "./contract.js";

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
  const instance = render(createElement(TerminalConsole, props));
  await instance.waitUntilExit();
  return { clean: exited };
}