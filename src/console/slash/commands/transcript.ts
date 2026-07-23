// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Transcript & session-control slash commands.
 *
 * The first topic group of the console's slash catalog: the verbs that reset,
 * rename, branch, inspect, or leave the live session view. Every row is a thin
 * {@link SlashCommand} whose `run` drives the injected {@link SlashContext} — a
 * reducer event, a conductor call, a modal, or an exit request — and settles to
 * {@link HANDLED}. Nothing here reaches into React, the filesystem, or a
 * provider SDK directly; backend work flows through the {@link SessionConductor}.
 *
 * The rename, stats, condense, and reload verbs are backed by real conductor
 * surface ({@link SessionConductor.setSessionName}, {@link SessionConductor.stats},
 * {@link SessionConductor.condense}). Where the conductor cannot accept a richer
 * input (the condense path is parameterless on this build), the closest real
 * action is taken and the status line explains precisely what was applied.
 */
import type { SlashCommand } from "../../contract";
/**
 * The transcript / session-control group, in listing order.
 *
 * Appended into the slash registry by the catalog integrator; this module owns
 * only the rows, never the wiring.
 */
export declare const transcriptCommands: SlashCommand[];
