// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Skill-parse subsystem — public barrel.
 *
 * Re-exports the re-derived skill-invocation block parser: the attribute-scanning
 * {@link parseSkillInvocation} hand parser and its structured {@link SkillInvocation}
 * result. Consumers (the conductor's submit path) import from
 * `src/conductor/skill-parse` rather than reaching into `parse`.
 */
export { parseSkillInvocation } from "./parse";
export type { SkillInvocation } from "./parse";
