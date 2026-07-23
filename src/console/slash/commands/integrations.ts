// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Integration slash commands — auth launchers, the external bridges, and the
 * clipboard / export / share I/O verbs.
 *
 * This group is the console's seam onto everything that lives *outside* a single
 * turn: signing in and out of a provider, wiring the MCP and memory surfaces,
 * connecting an external SaaS bridge, and moving the transcript out of the
 * terminal (clipboard, HTML export, a share link). The handlers do real work
 * where a backing capability exists — they render the live transcript to HTML
 * through the {@link publishTranscript} publisher, drive an {@link MCPClientPool}
 * over the workspace MCP config, reflect the working-memory card from the
 * capability deck, and reach the Composio catalog through the SaaS gateway — and
 * fall back to an *informative* status (never a dead placeholder) when a backend
 * is unreachable in the current environment.
 *
 * The two family commands (`/memory`, `/composio`) are built from
 * {@link SubCommand} tables via {@link familyRunner}, so their verb dispatch is a
 * lookup, not an `if`-ladder. Overlay surfaces (`mcp`, `memory`, `composio`)
 * carry the *gathered* text into the plugin modal payload, so the dialog renders
 * the real state the command collected rather than a fixed line.
 */
import type { SlashCommand } from "../../contract";
/**
 * The integration command group: auth launchers, the MCP/memory/composio
 * bridges, and the clipboard / export / share I/O verbs. Appended to the slash
 * registry by the integrator alongside the other groups.
 */
export declare const integrationCommands: SlashCommand[];
