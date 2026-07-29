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
import { Type, type Static } from "@sinclair/typebox";
import { capabilityId, type Capability, type CapabilityCard, type DeckContext } from "../contract.js";

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
export class TodoLedger {
    private items: readonly TodoItem[] = [];

    /** Replace the entire checklist with `next`; returns the stored snapshot. */
    set(next: readonly TodoItem[]): readonly TodoItem[] {
        this.items = Object.freeze([...next]);
        return this.items;
    }

    /** Return the current checklist as a frozen, read-only snapshot. */
    read(): readonly TodoItem[] {
        return this.items;
    }
}

const TodoItemSchema = Type.Object(
    {
        task: Type.String({ description: "Short imperative description of the work item." }),
        state: Type.Union(
            [
                Type.Literal("pending"),
                Type.Literal("active"),
                Type.Literal("done"),
                Type.Literal("dropped"),
            ],
            { description: "Lifecycle state of the item." },
        ),
        weight: Type.Union(
            [Type.Literal("low"), Type.Literal("normal"), Type.Literal("high")],
            { description: "Relative importance of the item." },
        ),
    },
    { additionalProperties: false },
);

const TodoParams = Type.Object(
    {
        action: Type.Union([Type.Literal("read"), Type.Literal("set")], {
            description:
                "`read` returns the current checklist; `set` replaces it with the items you provide.",
        }),
        items: Type.Optional(
            Type.Array(TodoItemSchema, {
                description:
                    "The complete desired checklist. Required for `set` (send the whole list, not a delta); ignored for `read`.",
            }),
        ),
    },
    { additionalProperties: false },
);

/** Statically-inferred parameter type the capability's `execute` receives. */
export type TodoParamsType = Static<typeof TodoParams>;

/** Structured detail returned alongside the model-facing content. */
export interface TodoDetails {
    /** The action that was performed. */
    readonly action: "read" | "set";
    /** The checklist as it stands after the call. */
    readonly items: readonly TodoItem[];
}

const TODO_DESCRIPTION =
    'Maintain a working checklist for the current task. Call with `action:"set"` and a complete `items` list to record or revise your plan \u2014 always send the full intended list, since the previous one is discarded. Call with `action:"read"` to recall the current plan. Mark items `active` while in progress and `done` when finished so the list reflects real status; use `dropped` for work you decided to skip.';

const STATE_GLYPH: Record<TodoState, string> = {
    pending: "[ ]",
    active: "[~]",
    done: "[x]",
    dropped: "[-]",
};

/** Render the checklist as model-facing prose. */
function renderChecklist(items: readonly TodoItem[]): string {
    if (items.length === 0) return "The checklist is empty.";
    const lines = items.map((it) => {
        const weight = it.weight === "normal" ? "" : ` (${it.weight})`;
        return `${STATE_GLYPH[it.state]} ${it.task}${weight}`;
    });
    return lines.join("\n");
}

/**
 * Build the todo capability, binding it to a freshly created in-memory ledger.
 *
 * The ledger is closed over by `execute`, so the checklist persists for the life
 * of this capability instance (i.e. the session) without any external store.
 *
 * @param _ctx the deck context (unused — the todo card needs no cwd/backends)
 */
export function buildTodoCapability(_ctx: DeckContext): Capability<typeof TodoParams, TodoDetails> {
    const ledger = new TodoLedger();
    return {
        name: "todo",
        label: "Checklist",
        description: TODO_DESCRIPTION,
        parameters: TodoParams,
        async execute(_toolCallId, params) {
            const items =
                params.action === "set" ? ledger.set(params.items ?? []) : ledger.read();
            const heading =
                params.action === "set" ? "Checklist updated:" : "Current checklist:";
            const text = `${heading}\n${renderChecklist(items)}`;
            return {
                content: [{ type: "text", text }],
                details: { action: params.action, items },
            };
        },
    };
}

/** Catalog row for the todo capability — registered in `CAPABILITY_CARDS`. */
export const todoCard: CapabilityCard = {
    id: capabilityId("todo"),
    title: "Checklist",
    summary: "Keep an in-memory checklist of the current task's steps; set or read it.",
    // The card surface is the erased `Capability`; the builder keeps its precise
    // params/details type for direct callers and erases here. The erasure goes
    // through `unknown` because TypeBox tools are invariant in their schema (the
    // framework's own tool arrays are `AgentTool<any>[]` for the same reason).
    build: (ctx) => buildTodoCapability(ctx),
};