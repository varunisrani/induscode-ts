// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Console mount — render the interactive surface and resolve on exit.
 *
 * The single entry point a run mode calls to take over the terminal: it
 * resolves the colour scheme, assembles the {@link ConsoleProps}, renders the
 * {@link TerminalConsole} through Ink's `render`, and returns a promise that
 * settles when the surface tears down (the user exits, or `requestExit` fires).
 *
 * This is the only console module that performs the actual Ink mount; everything
 * it composes (the reducer, theme, slash registry, input modules, surface
 * components) is pure or presentational. Keeping the mount here lets the rest of
 * the subsystem stay testable without an Ink runtime.
 */
import type { OverlayServices, SessionConductor, SlashRegistry } from "./contract";
/**
 * Options for {@link mountConsole}.
 *
 * Everything is optional with a sensible default: the theme falls back to the
 * default scheme, the slash registry to the built-in catalog, and the seeds to
 * empty. The conductor is the only required input and is passed positionally.
 */
export interface MountConsoleOptions {
    /** The colour scheme name to resolve (falls back to the default). */
    readonly scheme?: string | null;
    /** The slash registry to dispatch against (defaults to the built-in catalog). */
    readonly slash?: SlashRegistry;
    /** An optional first user turn to submit on mount. */
    readonly initialInput?: string;
    /** Optional local image paths to attach to the first turn. */
    readonly initialImages?: readonly string[];
    /** Whether to render verbose diagnostics in the banner. */
    readonly verbose?: boolean;
    /** The runtime handles the modal overlays drive; absent on headless paths. */
    readonly services?: OverlayServices;
}
/**
 * The handle a {@link mountConsole} call resolves with once the surface exits.
 */
export interface MountResult {
    /** Whether the surface tore down cleanly. */
    readonly clean: boolean;
}
/**
 * Render the interactive console for a session and resolve when it exits.
 *
 * Assembles the props, mounts {@link TerminalConsole} via Ink's `render`, and
 * wires an `onExit` callback (and Ink's `waitUntilExit`) so the returned promise
 * settles when the surface is dismissed.
 *
 * @param conductor the session this console drives
 * @param opts      optional theme / registry / seed overrides
 */
export declare function mountConsole(conductor: SessionConductor, opts?: MountConsoleOptions): Promise<MountResult>;
