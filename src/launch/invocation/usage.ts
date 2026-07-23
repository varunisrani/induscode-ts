// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * The usage renderer — generated entirely from {@link FLAG_SPECS}.
 *
 * {@link renderUsage} produces the `--help` banner by walking the same
 * declarative flag table the reader parses against. There is no second,
 * hand-maintained help string; every option line is synthesised from its
 * {@link FlagSpec} (its canonical name, its aliases, its value placeholder, and
 * its one-line description), grouped by the editorial {@link FLAG_GROUPS}
 * sections. Adding a flag to the table therefore adds it to the help with no
 * further edit, and the two can never disagree about what exists.
 *
 * The renderer is pure and total: it reads only the table and returns a string.
 */
/**
 * Render the full usage banner.
 *
 * Emits a synopsis line, then one section per {@link FLAG_GROUPS} entry that has
 * any rows, then a short note on the two positional conventions the reader
 * honours but that are not flags: the `@file` attachment syntax and the `--`
 * option terminator. Every option line is derived from {@link FLAG_SPECS}; this
 * function holds no per-flag knowledge of its own.
 *
 * @returns the complete multi-line usage string (no trailing newline)
 */
export declare function renderUsage(): string;
