// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Dynamic slash commands — capability cards and prompt templates as registry rows.
 *
 * The static catalog (`./builtins`) is hand-maintained, but two command families
 * are *discovered* at startup rather than written by hand: the Agent-Skills
 * capability cards ({@link SkillCard}s loaded from `SKILL.md` files) and the
 * user/project prompt templates ({@link Macro}s loaded from `*.md` macro files).
 * This module turns whatever was discovered into ordinary {@link SlashCommand}
 * rows so they sit in the same registry as the built-ins, complete the same way,
 * and resolve through the same dispatcher.
 *
 * Two row shapes are produced:
 *
 *   - `/skill:<name>` — invoking it submits an Agent-Skills *invocation block*
 *     (`<skill name="…" location="…">body</skill>`) as a normal turn, which is
 *     exactly what the agent loop recognises to load and run that skill. The
 *     trailing argument string becomes the skill body, so `/skill:commit tidy the
 *     diff` runs the `commit` card against "tidy the diff".
 *   - `/<template-name>` — invoking it expands the macro body against the
 *     trailing arguments (the single-pass `$arg` model from the briefing layer)
 *     and submits the result as a normal turn.
 *
 * Both return a `{ kind: "prompt" }` outcome so the dispatcher hands the produced
 * text to the conductor as a turn; neither reaches into a backend the console
 * does not own. When nothing was discovered, {@link buildDynamicCommands} returns
 * an empty array, so splicing it into the catalog is always safe.
 */
import type { Macro, SkillCard } from "../../../briefing";
import type { SlashCommand } from "../../contract";
/**
 * The discovered material a dynamic catalog is built from.
 *
 * Both fields are optional and default to empty: a caller that only loaded
 * skills passes `{ skills }`, one that only loaded templates passes `{ templates }`,
 * and a caller with neither passes `{}` (or nothing) and gets back `[]`.
 */
export interface DynamicCommandSources {
    /** Capability cards discovered from `SKILL.md` files. */
    readonly skills?: readonly SkillCard[];
    /** Prompt templates discovered from `*.md` macro files. */
    readonly templates?: readonly Macro[];
}
/**
 * Project discovered skills and templates into {@link SlashCommand} rows.
 *
 * Skill rows are listed first (namespaced under `skill:`), then the template
 * rows. A name claimed by an earlier row — including any of the static built-ins
 * a caller will concatenate these ahead of — is the registry's problem to reject
 * at assembly time; this function only suppresses *self*-collisions so a template
 * whose name duplicates a skill's `skill:`-prefixed token (impossible) or another
 * template (first wins) cannot crash the build. When no sources are supplied the
 * result is an empty array, never an error.
 *
 * @param sources the discovered skills and templates
 * @returns the dynamic command rows, skills first then templates
 */
export declare function buildDynamicCommands(sources?: DynamicCommandSources): SlashCommand[];
