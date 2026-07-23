// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Console sink — drains signals to a writable, one human-readable line each.
 *
 * The simplest terminal {@link Sink}: it pulls the {@link SignalStream} and
 * prints a compact line per signal — phase, kind, name, ids, and (on close) the
 * outcome and duration. Open and update lines are dimmed; close lines are
 * coloured by outcome. Colour is opt-in and degrades to plain text when the
 * target is not a TTY, so piping the output stays clean.
 *
 * The writer is injected (defaulting to `process.stdout`) so tests can capture
 * lines without touching the real terminal.
 */
import { Sink } from "../contract";
/** The minimal writable face the console sink needs. */
export interface LineWriter {
    /** Append a chunk; the sink always supplies a newline-terminated line. */
    write(chunk: string): unknown;
    /** Whether the target is an interactive terminal (enables colour). */
    readonly isTTY?: boolean;
}
/** Construction options for {@link createConsoleSink}. */
export interface ConsoleSinkOptions {
    /** Where lines go; defaults to `process.stdout`. */
    readonly writer?: LineWriter;
    /** Force colour on/off; defaults to the writer's TTY state. */
    readonly color?: boolean;
    /** Sink id; defaults to `"console"`. */
    readonly id?: string;
}
/**
 * Build a {@link Sink} that prints each signal as one line.
 *
 * @param options see {@link ConsoleSinkOptions}
 * @returns a console {@link Sink}
 */
export declare function createConsoleSink(options?: ConsoleSinkOptions): Sink;
