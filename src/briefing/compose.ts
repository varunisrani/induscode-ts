// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Briefing composer — the declarative system-prompt pipeline.
 *
 * The system prompt is assembled from an ordered list of {@link BriefingSection}
 * descriptors, not a string template with `{{TOKEN}}` holes. Each section decides
 * for itself whether it contributes to a given {@link BriefingContext} (its
 * `applies` predicate) and renders its own fragment (its `render`). The composer
 * is a small reducer: it walks the recipe in order, keeps the applicable
 * sections, renders them, drops empties, and joins with blank-line gaps. Adding,
 * removing, or reordering a section is a data edit to {@link BRIEFING_SECTIONS},
 * never a change to the composer.
 *
 * Every guideline, tool note, and heading below is authored for this rebuild.
 * The *set* of sections (role, tools, working guidance, task tracking, delegates,
 * connectors, project context, skills, footer) follows the well-known coding-
 * agent shape; the wording is the briefing's own.
 */
import type { Briefing, BriefingContext, BriefingInputs } from "./contract";
/**
 * The default briefing recipe, in render order. Swap or reorder entries to
 * reshape the prompt without touching {@link composeBriefing}.
 */
export declare const BRIEFING_SECTIONS: Briefing;
/**
 * Fold a section recipe and a context into the final briefing string.
 *
 * Accepts either a plain {@link BriefingContext} (using the default
 * {@link BRIEFING_SECTIONS} recipe) or a full {@link BriefingInputs} bundle that
 * names its own sections and optional `prelude` / `append` text. The composer
 * keeps each section whose `applies` predicate is satisfied (or absent), renders
 * it, discards empty fragments, and joins the rest with blank-line gaps. Optional
 * `prelude` and `append` bracket the rendered sections.
 *
 * @param input either the render context, or a full inputs bundle
 * @returns the assembled system-prompt string
 */
export declare function composeBriefing(input: BriefingContext | BriefingInputs): string;
