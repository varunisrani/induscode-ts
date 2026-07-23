// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Package root barrel — the public library surface of the indusagi coding agent.
 *
 * The terminal binary is `entry.ts` (the `indus` / `indusagi` bin). This barrel
 * exposes each subsystem as a namespace for embedding or testing. The agent
 * depends only on the `indusagi` framework package.
 */
export * as boot from "./boot";
export * as workspace from "./workspace";
export * as conductor from "./conductor";
export * as windowBudget from "./window-budget";
export * as capabilityDeck from "./capability-deck";
export * as runtimeBridge from "./runtime-bridge";
export * as addons from "./addons";
export * as consoleUi from "./console";
export * as channels from "./channels";
export * as briefing from "./briefing";
export * as transcriptExport from "./transcript-export";
export * as launch from "./launch";
export * as insight from "./insight";
export * as kit from "./kit";
export * as settings from "./settings";
export * as sessions from "./sessions";
export { VERSION } from "./workspace";
