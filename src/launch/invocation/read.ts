// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * The invocation reader — a generic, table-driven argv parser over
 * {@link FLAG_SPECS}.
 *
 * This is the application's full command-line grammar (the boot layer carries
 * only a thin routing parser). It walks a sliced `argv` once and folds every
 * token into a fully-typed {@link Invocation}: recognised flags bind through the
 * declarative {@link FlagSpec} table, `@file` references collect for the
 * attachment gatherer, and remaining positionals become the prompt and the
 * positional tail.
 *
 * The grammar is deliberately textbook and entirely data-driven — there is no
 * per-flag branch. One index over {@link FLAG_SPECS} maps every canonical name
 * and alias to its row; the loop applies whichever row a token resolves to:
 *
 *   - **`--name=value`** and **`--name value`** both bind a `string` / `number`
 *     / `list` flag; an inline `=value` wins, otherwise the following token is
 *     consumed (unless it is itself a flag, in which case the value is empty).
 *   - **longest-alias match** resolves the canonical name, so a longer spelling
 *     is never shadowed by a shorter prefix.
 *   - **`--`** terminates option parsing; every subsequent token is positional.
 *   - **clustered short booleans** (`-pi`) expand to each single-letter switch.
 *   - **`list` flags accumulate** across repetition and split a single
 *     comma-separated token into elements.
 *   - **`@file`** tokens are recorded as attachment references rather than
 *     positionals.
 *
 * The parse is total: an unrecognised `--flag` is tolerated as a boolean switch
 * in the loose {@link Invocation.flags} bag (the extension-flag escape hatch)
 * rather than rejected, so nothing is silently dropped. Strong typing of the
 * named fields, and mode derivation, happen in one final fold.
 */
import { type Invocation } from "../contract";
/**
 * Read a sliced `argv` into the fully-parsed {@link Invocation}.
 *
 * Walks the tokens once via the {@link FLAG_SPECS} index, accumulates into a
 * {@link ParseState}, then folds that into the strongly-typed result: the loose
 * {@link Invocation.flags} bag is retained for round-tripping and extension
 * flags, and the named fields are derived from it with per-kind coercion and
 * validation. The `attachments` field is left unset here — the file references
 * are surfaced for the attachment gatherer to expand separately.
 *
 * @param argv the already-sliced argument vector (no node / executable path)
 */
export declare function readInvocation(argv: readonly string[]): Invocation;
/**
 * The `@file` references collected from an argv, exposed for the attachment
 * gatherer. A thin re-walk of the reader so the file references can be obtained
 * without re-deriving the whole parse where only attachments are needed.
 */
export declare function readFileReferences(argv: readonly string[]): string[];
