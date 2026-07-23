// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * The built-in slash catalog — the single ordered source of truth.
 *
 * The catalog is assembled from three static topic groups, each its own module
 * under `./commands/`: transcript/session control, the workbench pickers
 * (model/models-for/theme/settings/help/keys/whats-new/debug), and the
 * integration bridges (login/logout/mcp/memory/composio/copy/export/share). On
 * top of those it splices in the *dynamic* rows — one `/skill:<name>` per
 * discovered Agent-Skills capability card and one `/<template-name>` per
 * discovered prompt-template macro — produced by {@link buildDynamicCommands}.
 *
 * There is no command `if`-ladder anywhere: adding a static command is appending
 * a row to one of the groups, and the dynamic rows are discovered at module load
 * from the standard skill/macro roots (returning nothing, never an error, when
 * those roots are absent). The registry index, the completion matcher, and the
 * family grouping are all *derived* from {@link SLASH_COMMANDS} (see
 * `registry.ts`).
 *
 * Listing order is intentional: transcript controls first (the verbs a new user
 * meets), then the workbench pickers, then the integration bridges, and finally
 * the discovered skills and templates.
 */
import type { SlashCommand } from "../contract";
/** The family labels the catalog groups commands under (for `/help`). */
export { FAMILY } from "./commands/shared";
/**
 * The built-in catalog — every command row in listing order.
 *
 * Consumers fold this into a {@link SlashRegistry} via `buildRegistry`; the index
 * by name/alias, the family grouping, and the completion matcher are all derived
 * from this one array.
 */
export declare const SLASH_COMMANDS: readonly SlashCommand[];
