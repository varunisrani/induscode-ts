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
import { Type, type Static } from "@sinclair/typebox";
import { capabilityId, type Capability, type CapabilityCard, type DeckContext } from "../contract.js";

/** Key under which a host may wire a framework-backed memory store in later. */
export const MEMORY_HANDLE_KEY = "memoryStore" as const;

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
export class InMemoryStore implements MemoryStore {
    private buffer = "";

    read(): string {
        return this.buffer;
    }

    replace(content: string): void {
        this.buffer = content;
    }

    append(line: string): void {
        this.buffer = this.buffer.length === 0 ? line : `${this.buffer}\n${line}`;
    }
}

const MemoryParams = Type.Object(
    {
        action: Type.Union(
            [Type.Literal("read"), Type.Literal("replace"), Type.Literal("append")],
            {
                description:
                    "`read` returns the note; `replace` overwrites it; `append` adds a line to the end.",
            },
        ),
        content: Type.Optional(
            Type.String({
                description:
                    "New note body (for `replace`) or the line to add (for `append`). Ignored for `read`.",
            }),
        ),
    },
    { additionalProperties: false },
);

/** Statically-inferred parameter type the capability's `execute` receives. */
export type MemoryParamsType = Static<typeof MemoryParams>;

/** Structured detail returned alongside the model-facing content. */
export interface MemoryDetails {
    readonly action: "read" | "replace" | "append";
    readonly ok: boolean;
    /** Length of the note after the call, for quick status. */
    readonly length: number;
}

const MEMORY_DESCRIPTION =
    'Keep a small working-memory note that persists across turns \u2014 durable facts, decisions, or reminders you want to retain even after older messages scroll out of context. Use `action:"read"` to recall it, `action:"replace"` to rewrite it from scratch, and `action:"append"` to add a single line. Keep it concise; it is a scratchpad, not a log.';

/** Read the optional memory store handle from the deck context, falling back to in-memory. */
function readStore(ctx: DeckContext): MemoryStore {
    const handle = ctx.framework?.[MEMORY_HANDLE_KEY];
    if (
        handle &&
        typeof (handle as MemoryStore).read === "function" &&
        typeof (handle as MemoryStore).replace === "function" &&
        typeof (handle as MemoryStore).append === "function"
    ) {
        return handle as MemoryStore;
    }
    return new InMemoryStore();
}

/**
 * Build the working-memory capability, binding it to an injected store when one
 * is wired into the context, or a fresh in-memory store otherwise.
 *
 * @param ctx the deck context; an optional store is read from
 *            `ctx.framework[MEMORY_HANDLE_KEY]`.
 */
export function buildMemoryCapability(ctx: DeckContext): Capability<typeof MemoryParams, MemoryDetails> {
    const store = readStore(ctx);
    return {
        name: "memory",
        label: "Working memory",
        description: MEMORY_DESCRIPTION,
        parameters: MemoryParams,
        async execute(_toolCallId, params) {
            if (params.action === "replace") store.replace(params.content ?? "");
            else if (params.action === "append" && params.content) store.append(params.content);
            const note = store.read();
            const heading =
                params.action === "read"
                    ? "Working memory:"
                    : params.action === "replace"
                        ? "Working memory replaced:"
                        : "Working memory appended:";
            const body = note.length === 0 ? "(empty)" : note;
            return {
                content: [{ type: "text", text: `${heading}\n${body}` }],
                details: { action: params.action, ok: true, length: note.length },
            };
        },
    };
}

/** Catalog row for the working-memory capability. */
export const memoryCard: CapabilityCard = {
    id: capabilityId("memory"),
    title: "Working memory",
    summary: "Read and update a persistent scratch note that survives across turns.",
    // Erase the precisely-typed builder to the `Capability` card surface (through
    // `unknown`, as TypeBox tools are invariant in their parameter schema).
    build: (ctx) => buildMemoryCapability(ctx),
};