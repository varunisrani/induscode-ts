// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Todo capability — an in-memory checklist the agent set/reads during a run.
 *
 * App-novel and framework-agnostic: the store is a plain in-process array of
 * items, owned by the card and closed over by the built capability. No file
 * persistence, no session-branch reconstruction, no framework store — just a
 * mutable list the agent rewrites wholesale (the model is expected to send the
 * complete desired list on every `set`, the same convention coding agents use so
 * the plan stays a single coherent snapshot rather than a diff stream).
 *
 * Two operations are folded into one tool keyed by an `action` discriminant:
 *   - `read` — return the current checklist as model-facing prose.
 *   - `set`  — replace the checklist with the supplied items (the authoritative
 *              new plan), then echo it back.
 *
 * The card produces a {@link Capability} (the framework `AgentTool` shape) so the
 * conductor consumes it verbatim as one of `options.tools`. Parameters are a
 * TypeBox schema; the prose below is original to this deck.
 */
import { type Static } from "@sinclair/typebox";
import type { Capability, CapabilityCard, DeckContext } from "../contract";
/** Lifecycle state of one checklist item. */
export type TodoState = "pending" | "active" | "done" | "dropped";
/** Relative importance of one checklist item. */
export type TodoWeight = "low" | "normal" | "high";
/** One row of the in-memory checklist. */
export interface TodoItem {
    /** The work to be done, phrased as a short imperative. */
    readonly task: string;
    /** Where the item stands right now. */
    readonly state: TodoState;
    /** How much it matters relative to the rest of the list. */
    readonly weight: TodoWeight;
}
/**
 * A minimal in-process checklist store.
 *
 * Deliberately tiny and synchronous: the whole list lives in one field, `set`
 * swaps it atomically, and `read` hands back a frozen copy so a caller cannot
 * mutate the store's backing array. One store is created per built capability,
 * so two sessions never share a checklist.
 */
export declare class TodoLedger {
    private items;
    /** Replace the entire checklist with `next`; returns the stored snapshot. */
    set(next: readonly TodoItem[]): readonly TodoItem[];
    /** Return the current checklist as a frozen, read-only snapshot. */
    read(): readonly TodoItem[];
}
declare const TodoParams: import("@sinclair/typebox").TObject<{
    action: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"read">, import("@sinclair/typebox").TLiteral<"set">]>;
    items: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        task: import("@sinclair/typebox").TString;
        state: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"pending">, import("@sinclair/typebox").TLiteral<"active">, import("@sinclair/typebox").TLiteral<"done">, import("@sinclair/typebox").TLiteral<"dropped">]>;
        weight: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"low">, import("@sinclair/typebox").TLiteral<"normal">, import("@sinclair/typebox").TLiteral<"high">]>;
    }>>>;
}>;
/** Statically-inferred parameter type the capability's `execute` receives. */
export type TodoParamsType = Static<typeof TodoParams>;
/** Structured detail returned alongside the model-facing content. */
export interface TodoDetails {
    /** The action that was performed. */
    readonly action: "read" | "set";
    /** The checklist as it stands after the call. */
    readonly items: readonly TodoItem[];
}
/**
 * Build the todo capability, binding it to a freshly created in-memory ledger.
 *
 * The ledger is closed over by `execute`, so the checklist persists for the life
 * of this capability instance (i.e. the session) without any external store.
 *
 * @param _ctx the deck context (unused — the todo card needs no cwd/backends)
 */
export declare function buildTodoCapability(_ctx: DeckContext): Capability<typeof TodoParams, TodoDetails>;
/** Catalog row for the todo capability — registered in `CAPABILITY_CARDS`. */
export declare const todoCard: CapabilityCard;
export {};
