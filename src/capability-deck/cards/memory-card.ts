// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Working-memory capability — read and update a persistent scratch note the
 * agent carries across turns.
 *
 * Status: minimal in-memory implementation + clearly-typed seam for the
 * framework memory subsystem.
 *
 * This card ships a self-contained, framework-agnostic default: a single mutable
 * text buffer the agent overwrites or appends to, scoped to one built capability
 * (one session). A host that wants persistence injects a durable store under
 * {@link MEMORY_HANDLE_KEY} via {@link DeckContext.framework} — the boot layer's
 * `DiskMemoryStore` (`boot/runners/memdir.ts`) does exactly this, persisting the
 * note to a per-cwd `MEMORY.md` so it survives across sessions. The
 * {@link Capability} surface and the tool's wire contract do not change either
 * way; {@link readStore} validates the injected store's three methods and falls
 * back to {@link InMemoryStore} when none is wired.
 *
 * The single tool keys behavior on an `action` discriminant:
 *   - `read`    — return the current working-memory note.
 *   - `replace` — overwrite the note with the supplied `content`.
 *   - `append`  — add a line to the end of the note.
 */
import { type Static } from "@sinclair/typebox";
import type { Capability, CapabilityCard, DeckContext } from "../contract";
/** Key under which a host may wire a framework-backed memory store in later. */
export declare const MEMORY_HANDLE_KEY: "memoryStore";
/**
 * The narrow port the memory capability binds to.
 *
 * The in-memory default below satisfies it; a future framework-backed store can
 * be adapted to the same three methods and injected through the context.
 */
export interface MemoryStore {
    read(): string;
    replace(content: string): void;
    append(line: string): void;
}
/** A trivial in-process working-memory buffer, one per built capability. */
export declare class InMemoryStore implements MemoryStore {
    private buffer;
    read(): string;
    replace(content: string): void;
    append(line: string): void;
}
declare const MemoryParams: import("@sinclair/typebox").TObject<{
    action: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"read">, import("@sinclair/typebox").TLiteral<"replace">, import("@sinclair/typebox").TLiteral<"append">]>;
    content: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
/** Statically-inferred parameter type the capability's `execute` receives. */
export type MemoryParamsType = Static<typeof MemoryParams>;
/** Structured detail returned alongside the model-facing content. */
export interface MemoryDetails {
    readonly action: "read" | "replace" | "append";
    readonly ok: boolean;
    /** Length of the note after the call, for quick status. */
    readonly length: number;
}
/**
 * Build the working-memory capability, binding it to an injected store when one
 * is wired into the context, or a fresh in-memory store otherwise.
 *
 * @param ctx the deck context; an optional store is read from
 *            `ctx.framework[MEMORY_HANDLE_KEY]`.
 */
export declare function buildMemoryCapability(ctx: DeckContext): Capability<typeof MemoryParams, MemoryDetails>;
/** Catalog row for the working-memory capability. */
export declare const memoryCard: CapabilityCard;
export {};
