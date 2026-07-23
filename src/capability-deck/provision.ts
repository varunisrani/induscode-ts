// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Deck provisioning — the single data-driven assembler.
 *
 * One function, {@link provisionDeck}, turns a {@link DeckProfile} plus a
 * {@link DeckContext} into an assembled {@link ToolDeck}. It replaces what would
 * otherwise be a trio of near-identical `buildAuthoringTools` / `buildSurveyTools`
 * / `buildAllTools` functions with a single walk over a {@link PROFILE_TABLE}: the
 * table says which catalog rows each profile draws from, the assembler builds
 * exactly those rows against the context, and the result exposes the two reads the
 * conductor needs — {@link ToolDeck.tools} (the flat capability list) and
 * {@link ToolDeck.box} (the consumable `AgentTool[]` it wires in as
 * `options.tools`).
 *
 * Why a table rather than three functions:
 *   - The catalog is already the single source of truth (`CAPABILITY_CARDS` plus
 *     the app-novel cards). A profile is just a *selection policy* over that
 *     catalog, so it is data — a small row per profile — not control flow.
 *   - Adding a profile, or moving a card between profiles, is a one-line table
 *     edit with no new branch to keep in sync.
 *
 * Breadth runs `authoring` (narrowest, read-only) -> `survey` (all built-ins) ->
 * `all` (built-ins + app cards), spelled out per profile below.
 *
 * The three profiles, in increasing breadth:
 *   - `authoring` — the read-only built-in subset: the observe-only tools the
 *     framework exposes (read/ls/grep/find/web search & fetch/checklist-read). No
 *     filesystem mutation, no shell, no app-novel cards. The safe selection for a
 *     session that must inspect a workspace without changing it.
 *   - `survey`    — the wider built-in subset: every framework built-in,
 *     including the mutating ones (write/edit/bash/process/checklist-write). Still
 *     no app-novel cards — just the full native tool set.
 *   - `all`       — everything: every framework built-in plus every app-novel
 *     card (the checklist, the background-process proxy, the delegate/sub-agent
 *     action, the SaaS connector, working memory).
 *
 * The built-in catalog tags each native tool with the profiles it belongs to
 * (`read` etc. are observe-only; `bash`/`write` are mutating); this table maps the
 * deck profiles onto those membership selections, so the read-only/wider split is
 * a table lookup rather than a hand-maintained second tool list.
 *
 * Bridge (MCP) capabilities are *not* selected here — they are grafted at runtime
 * through the bridge ledger and concatenated by the host onto a deck's
 * {@link ToolDeck.tools}; provisioning only assembles the static catalog.
 */
import type { CapabilityCard, DeckContext, DeckProfile, ToolDeck } from "./contract";
/**
 * The catalog rows a profile selects, in catalog order: the built-in subset the
 * policy names, followed by the app-novel cards when the policy grants them.
 *
 * Derived purely from {@link PROFILE_TABLE} + the catalog — no per-profile
 * branching beyond the table lookup.
 *
 * @param profile the requested deck profile
 */
export declare function cardsForDeckProfile(profile: DeckProfile): CapabilityCard[];
/**
 * Provision a {@link ToolDeck} for a profile and working context.
 *
 * Looks the profile up in {@link PROFILE_TABLE}, selects its catalog rows,
 * builds each against `ctx`, and returns a deck that hands the resulting
 * capabilities out two ways:
 *   - {@link ToolDeck.tools} — the flat `AnyCapability[]` for inspection,
 *     naming, and `--tools` style selection.
 *   - {@link ToolDeck.box}   — the same `AnyCapability[]` (= the framework
 *     `AgentTool[]`) the conductor consumes verbatim as
 *     `SessionConductorOptions.tools`.
 *
 * The capabilities are built once, at provision time, and the same list backs
 * both reads (returned as fresh copies so a caller cannot mutate the deck's
 * backing array). Bridge/MCP tools are concatenated onto `tools()` by the host
 * after provisioning; they are not part of the static selection.
 *
 * @param profile the requested capability set (`authoring` | `survey` | `all`)
 * @param ctx     the working context (cwd + injectable backends) to bind cards to
 */
export declare function provisionDeck(profile: DeckProfile, ctx: DeckContext): ToolDeck;
