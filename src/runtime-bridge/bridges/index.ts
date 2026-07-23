// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Bridges subsystem — public barrel.
 *
 * Bundles the three shipped external-runtime {@link RuntimeBridge}s — the
 * Anthropic-flavoured `claude-cli`, the OpenAI-flavoured `codex-cli`, and the
 * peer JSON-RPC `indusagi-cli` — plus the built-in runtime spec catalog and the
 * model-annotation helpers. Consumers register the bridges with a
 * {@link RuntimeBroker} and annotate catalog cards via this barrel rather than
 * reaching into the individual modules.
 */
export { claudeCliBridge } from "./claude-cli";
export { codexCliBridge } from "./codex-cli";
export { indusagiCliBridge, makeIndusagiCliBridge } from "./indusagi-cli";
export { BUILTIN_RUNTIME_SPECS, BUILTIN_ADAPTERS, builtinRuntimeSpec, annotateCard, withRuntimeEndpoint, specFromModel, type RuntimeAnnotatedModel, } from "./builtins";
export { driveExchange, seedFromModel, asRecord, strField, errorText, type ChildParser, type ParseStep, } from "./_drive";
