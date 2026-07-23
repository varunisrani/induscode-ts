// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Secret redaction — the attribute processor the pipeline runs before a sink.
 *
 * A {@link SecretRedactor} (contract) walks a probe's attribute bag and its
 * fault, replacing sensitive values with the {@link REDACTED_TOKEN}. Three things
 * can trigger a redaction:
 *
 *   1. a *key-path* match — the attribute key (or a nested object key) looks like
 *      a secret holder (`apiKey`, `password`, `authorization`, ...);
 *   2. a *value* match — a string looks like a credential regardless of its key
 *      (a bearer token, an `sk-` key, a private-key block, ...);
 *   3. an *omit* — a key listed in {@link RedactionOptions.omitKeys} is dropped
 *      from the output entirely rather than tokenized.
 *
 * The scrubber is *streaming* in the sense that it walks structures depth-first,
 * tracking the current key as it descends so nested secrets (`{ http: { headers:
 * { authorization: "..." } } }`) are caught by key without the caller flattening
 * anything. Output is always freshly allocated and frozen; the input probe is
 * never mutated. The default rule set and token are the agent's own — they do not
 * mirror any upstream redactor.
 */
import { RedactionOptions, RedactionRule, SecretRedactor } from "./contract";
/**
 * The agent's own default redaction rule set.
 *
 * One key rule covering every secret-bearing key fragment, plus one value rule
 * per credential shape. Exposed so callers can extend rather than replace it.
 */
export declare const DEFAULT_REDACTION_RULES: readonly RedactionRule[];
/**
 * Build a {@link SecretRedactor} from a rule set and options.
 *
 * @param rules   the redaction rules to apply, in order; defaults to
 *                {@link DEFAULT_REDACTION_RULES}
 * @param options length cap and key omissions; see {@link RedactionOptions}
 * @returns a frozen redactor; its `scrub*` methods never mutate their inputs
 */
export declare function createRedactor(rules?: readonly RedactionRule[], options?: RedactionOptions): SecretRedactor;
/**
 * A ready-built redactor using the agent's default rules and default caps.
 *
 * The pipeline installs this when redaction is enabled but unconfigured.
 */
export declare const DEFAULT_REDACTOR: SecretRedactor;
