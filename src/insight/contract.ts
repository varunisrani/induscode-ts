// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Insight contract — the FROZEN type surface of the unified tracing system.
 *
 * `insight/` is the single observability plane of the coding agent. It collapses
 * what used to be two overlapping tracing systems into one with a fresh, OTel-free
 * vocabulary:
 *
 *   - a {@link Trail} is a whole trace (the tree of work for one logical activity);
 *   - a {@link Probe} is one immutable timed segment within a trail (a span);
 *   - a {@link Signal} is one lifecycle event on the wire (open / update / close);
 *   - a {@link Recorder} mints trails and probes through a {@link SampleGate};
 *   - a {@link Sink} drains a stream of signals somewhere (console / file / network);
 *   - a {@link SecretRedactor} scrubs sensitive values before they reach a sink.
 *
 * This module declares *only* shapes plus a handful of inert, pure constants and
 * guards — no I/O, no timers, no batching, no network. Every behaviour module in
 * `insight/` (the recorder, the flush buffer, the sinks, the redactor, the agent
 * bridges, the session rehydrator, the ledger, and the dashboard panel) is written
 * against the names declared here, so this file is intentionally small,
 * append-mostly, and stable.
 *
 * Design stance:
 *   - A {@link Probe} is a plain frozen value object, never a class instance and
 *     never mutated in place. The lifecycle (open -> note -> close) is expressed by
 *     producing *new* probe values; the behavioural face is the functional
 *     {@link ProbeHandle} (a small bag of closures: `note` / `child` / `fail` /
 *     `close`). There is no `BaseSpan` / `DefaultSpan` / `NoopSpan` inheritance
 *     shape: a sampled-out handle is the single frozen {@link NOOP_HANDLE} value.
 *   - Ids follow the W3C Trace Context sizing (128-bit trail ids, 64-bit probe
 *     ids) without depending on any OTel SDK. {@link TrailId} / {@link ProbeId}
 *     are nominal-ish branded strings so a probe id is never mistaken for a trail
 *     id at a call site.
 *   - The wire form is a closed {@link Signal} union discriminated by `phase`.
 *     A sink consumes signals; it never reaches into recorder internals.
 *   - Redaction is an attribute *processor* contract ({@link SecretRedactor}),
 *     applied by the pipeline before a signal reaches a sink, with the agent's
 *     own patterns and its own {@link REDACTED_TOKEN}.
 *
 * Nothing here imports the framework; `insight/` is framework-agnostic at the
 * contract layer. The agent/ai-coupled bridges live in sibling modules and depend
 * on `indusagi/agent` + `indusagi/ai` there, not here.
 */
/**
 * A branded string naming a {@link Trail}.
 *
 * Lowercase hex, 32 chars (128 bits) by convention — the W3C Trace Context
 * trace-id width. The brand is a phantom marker that exists only in the type
 * system; at runtime a {@link TrailId} is just a `string`.
 */
export type TrailId = string & {
    readonly __brand: "TrailId";
};
/**
 * A branded string naming a {@link Probe}.
 *
 * Lowercase hex, 16 chars (64 bits) by convention — the W3C Trace Context
 * span-id width. Distinct from {@link TrailId} so the two cannot be transposed.
 */
export type ProbeId = string & {
    readonly __brand: "ProbeId";
};
/** The byte widths the id minter uses, kept as the single source of truth. */
export declare const ID_WIDTHS: {
    /** A trail id is 16 random bytes -> 32 hex chars (128-bit). */
    readonly trail: 16;
    /** A probe id is 8 random bytes -> 16 hex chars (64-bit). */
    readonly probe: 8;
};
/** Coerce a raw string into a {@link TrailId}. Inert — performs no validation. */
export declare function asTrailId(raw: string): TrailId;
/** Coerce a raw string into a {@link ProbeId}. Inert — performs no validation. */
export declare function asProbeId(raw: string): ProbeId;
/**
 * The kind of work a {@link Probe} records.
 *
 * A small, closed set chosen for a coding agent rather than a generic span tree:
 *   - `run`    — a whole agent run / top-level invocation (the trail root).
 *   - `turn`   — one request/response turn inside a run.
 *   - `tool`   — a single tool or side-effecting action execution.
 *   - `model`  — a single model / LLM generation call.
 *   - `custom` — anything a caller wants to time that does not fit above.
 */
export type ProbeKind = "run" | "turn" | "tool" | "model" | "custom";
/** The closed set of {@link ProbeKind} values, ordered for display / iteration. */
export declare const PROBE_KINDS: readonly ProbeKind[];
/**
 * The lifecycle status of a {@link Probe}.
 *
 * `open` while in flight; on close it becomes one of the two terminal states.
 */
export type ProbeStatus = "open" | "ok" | "error";
/** The two terminal {@link ProbeStatus} values a close may carry. */
export type ProbeOutcome = "ok" | "error";
/**
 * A captured failure attached to a probe.
 *
 * Intentionally minimal and serializable — a message plus optional name and a
 * pre-rendered stack string. A redactor may rewrite any of these fields.
 */
export interface ProbeFault {
    /** Human-readable failure summary. Always present. */
    readonly message: string;
    /** The error constructor / category name, when known. */
    readonly name?: string;
    /** A pre-rendered stack trace, when captured. */
    readonly stack?: string;
}
/**
 * An arbitrary structured annotation bag attached to a probe.
 *
 * A frozen, read-only map of JSON-ish values. The pipeline runs every bag
 * through a {@link SecretRedactor} before it reaches a {@link Sink}.
 */
export type ProbeAttributes = Readonly<Record<string, unknown>>;
/**
 * An immutable timed segment within a {@link Trail}.
 *
 * Every field is `readonly`; a probe value is frozen at construction and never
 * mutated in place. Transitions (note / close) are modelled as *new* frozen
 * values derived from a prior one, which keeps the data model trivially
 * serializable. A probe with `endedAt === undefined` is still in flight.
 */
export interface Probe {
    /** This probe's own id, unique within its trail. */
    readonly id: ProbeId;
    /** The trail this probe belongs to; shared by all of its kin. */
    readonly trailId: TrailId;
    /** The enclosing probe's {@link ProbeId}, or `null` for a trail root. */
    readonly parentId: ProbeId | null;
    /** What kind of work this probe records. */
    readonly kind: ProbeKind;
    /** Human-readable label for the probe. */
    readonly name: string;
    /** Wall-clock start, in epoch milliseconds. */
    readonly startedAt: number;
    /** Wall-clock end, in epoch milliseconds; `undefined` while still open. */
    readonly endedAt?: number;
    /** Lifecycle status. */
    readonly status: ProbeStatus;
    /** Arbitrary structured annotations; a frozen, read-only bag. */
    readonly attributes: ProbeAttributes;
    /** Present only once a probe has failed. */
    readonly fault?: ProbeFault;
}
/**
 * The exported, serializable form of a *closed* {@link Probe}.
 *
 * Structurally a {@link Probe} guaranteed terminal: `endedAt` is a number (not
 * `undefined`) and `status` is one of the two {@link ProbeOutcome} values. This
 * is what a close {@link Signal} carries and what a {@link Sink} persists; it
 * never appears for a probe still in flight.
 */
export interface ClosedProbe extends Probe {
    readonly endedAt: number;
    readonly status: ProbeOutcome;
}
/** Type guard: narrow a {@link Probe} to a terminal {@link ClosedProbe}. */
export declare function isClosedProbe(probe: Probe): probe is ClosedProbe;
/**
 * The behavioural face of a single in-flight {@link Probe}.
 *
 * Where {@link Probe} is the immutable data, a {@link ProbeHandle} is the small
 * bag of closures a caller actually uses. Each operation derives the next frozen
 * probe value and emits a {@link Signal} onto an injected emit closure. There is
 * no class hierarchy: a sampled-in handle is a plain object of closures and a
 * sampled-out handle is the single frozen {@link NOOP_HANDLE}.
 *
 * Forgiving lifecycle: `note`, `child`, and `fail` are no-ops after `close`, and
 * `close` itself is idempotent (first call wins). This makes double-close in a
 * `finally` block harmless.
 */
export interface ProbeHandle {
    /** The trail this handle's probe belongs to. Stable across the trail. */
    readonly trailId: TrailId;
    /** This probe's own id. The empty {@link ProbeId} for the {@link NOOP_HANDLE}. */
    readonly id: ProbeId;
    /** Whether this handle does real work (`true`) or is the sampled-out no-op. */
    readonly sampled: boolean;
    /** Amend the probe's attributes (last-writer-wins); emits an `update` signal. */
    note(attributes: ProbeAttributes): void;
    /** Open a child probe under this one, sharing the trail; returns its handle. */
    child(kind: ProbeKind, name: string, attributes?: ProbeAttributes): ProbeHandle;
    /** Record a failure (sets the closing status to `error`). Does not close. */
    fail(error: unknown): void;
    /** Close the probe; emits a `close` signal carrying the {@link ClosedProbe}. */
    close(outcome?: ProbeOutcome): void;
}
/**
 * The single shared sampled-out handle.
 *
 * A frozen no-op satisfying {@link ProbeHandle}: it emits nothing, allocates
 * nothing per call, and returns *itself* from `child` so an entire sampled-out
 * subtree costs nothing. This is the whole no-op story — there is no class to
 * subclass.
 */
export declare const NOOP_HANDLE: ProbeHandle;
/**
 * The lifecycle phase a {@link Signal} reports.
 *
 *   - `open`   — a probe was just opened (carries the fresh open {@link Probe}).
 *   - `update` — an open probe gained attributes or a fault (carries the new
 *     value, still open).
 *   - `close`  — a probe reached a terminal state (carries a {@link ClosedProbe}).
 */
export type SignalPhase = "open" | "update" | "close";
/** A probe-open event on the wire. */
export interface OpenSignal {
    readonly phase: "open";
    /** The freshly opened, still-in-flight probe. */
    readonly probe: Probe;
    /** Emission clock, epoch ms. */
    readonly at: number;
}
/** A probe-update event on the wire (attributes amended or a fault recorded). */
export interface UpdateSignal {
    readonly phase: "update";
    /** The derived probe value; still open. */
    readonly probe: Probe;
    /** Emission clock, epoch ms. */
    readonly at: number;
}
/** A probe-close event on the wire (terminal). */
export interface CloseSignal {
    readonly phase: "close";
    /** The terminal probe value a sink persists. */
    readonly probe: ClosedProbe;
    /** Emission clock, epoch ms. */
    readonly at: number;
}
/**
 * The closed union of trace events, discriminated by `phase`.
 *
 * This is the only thing that crosses the pipeline: the recorder emits
 * {@link Signal}s, the flush buffer batches them, the redactor scrubs the
 * carried probe attributes, and every {@link Sink} consumes them. Renaming a
 * recorder internal never changes this surface.
 */
export type Signal = OpenSignal | UpdateSignal | CloseSignal;
/** Type guard: narrow a {@link Signal} to a terminal {@link CloseSignal}. */
export declare function isCloseSignal(signal: Signal): signal is CloseSignal;
/**
 * The emit closure a recorder hands to its probe handles.
 *
 * A handle calls this once per lifecycle transition; the recorder routes it to
 * the redactor and flush buffer. Kept as a bare function so the contract layer
 * stays I/O-free.
 */
export type SignalEmit = (signal: Signal) => void;
/**
 * Admission control for trail roots.
 *
 * A {@link SampleGate} decides, once per *trail*, whether work is recorded
 * (returning live handles) or collapsed to {@link NOOP_HANDLE}. The decision is
 * keyed on the trail name so that named activities can be sampled at different
 * rates; the verdict is sticky for the whole trail — a probe never disagrees
 * with its enclosing trail about whether it is sampled.
 */
export interface SampleGate {
    /**
     * Decide whether a new trail with the given root name is recorded.
     *
     * `true` admits the trail (live handles); `false` collapses it to no-ops.
     */
    admit(rootName: string): boolean;
}
/** The two well-known fixed gates the recorder can fall back to. */
export interface FixedGates {
    /** A gate that admits every trail. */
    readonly always: SampleGate;
    /** A gate that rejects every trail. */
    readonly never: SampleGate;
}
/**
 * An async iterable stream of signals handed to a {@link Sink}.
 *
 * The pipeline owns production; a sink owns consumption. Modelling the boundary
 * as an async iterable (rather than a callback) lets a sink apply natural
 * back-pressure simply by awaiting between pulls.
 */
export type SignalStream = AsyncIterable<Signal>;
/**
 * A terminal consumer of trace signals.
 *
 * A sink {@link Sink.drain | drains} a {@link SignalStream} to completion,
 * writing each signal somewhere — the terminal, an NDJSON file, a network
 * endpoint, an in-memory buffer for tests. `drain` resolves when the stream is
 * exhausted (or rejects if the underlying writer fails); it is the sink's whole
 * obligation.
 */
export interface Sink {
    /** A short identifier used in diagnostics and config (e.g. `"console"`). */
    readonly id: string;
    /** Consume the stream to completion, writing each signal to the target. */
    drain(stream: SignalStream): Promise<void>;
}
/** Inputs for opening a fresh trail root. */
export interface OpenTrailInput {
    /** Human-readable label for the root probe (the activity name). */
    readonly name: string;
    /** The root probe's kind; defaults to `run` when omitted. */
    readonly kind?: ProbeKind;
    /** Pre-assigned trail id; one is minted when omitted. */
    readonly trailId?: TrailId;
    /** Initial annotations on the root probe. */
    readonly attributes?: ProbeAttributes;
}
/**
 * The single recorder facade the agent talks to.
 *
 * A {@link Recorder} mints trails and routes their signals through the pipeline.
 * It owns the {@link SampleGate}, the {@link SecretRedactor}, and the configured
 * {@link Sink}s; callers only ever see {@link ProbeHandle}s. The two opening
 * methods differ only in whether a parent trail already exists:
 *   - {@link Recorder.openTrail} starts a *new* trail and returns its root
 *     handle (or {@link NOOP_HANDLE} when the gate rejects it);
 *   - {@link Recorder.scope} returns a per-trail recorder view bound to one
 *     trail id, used by the bridges and rehydrator that already know the trail.
 */
export interface Recorder {
    /** The service name stamped on emitted signals (e.g. for a dashboard panel). */
    readonly service: string;
    /** Whether this recorder records at all (a disabled recorder is all no-ops). */
    readonly enabled: boolean;
    /** Open a brand-new trail; returns its root {@link ProbeHandle}. */
    openTrail(input: OpenTrailInput): ProbeHandle;
    /** Bind a {@link TrailRecorder} view to an existing trail id. */
    scope(trailId: TrailId): TrailRecorder;
    /** Flush any buffered signals to all sinks and resolve when settled. */
    flush(): Promise<void>;
    /** Flush, then detach all sinks; the recorder is unusable afterwards. */
    shutdown(): Promise<void>;
}
/**
 * A recorder view bound to one trail.
 *
 * Bridges and the session rehydrator obtain a {@link TrailRecorder} via
 * {@link Recorder.scope} so they can open probes onto a known trail without
 * re-minting the trail id on every event. `open` adds a root-level probe to the
 * bound trail; `child` adds a probe under a known parent.
 */
export interface TrailRecorder {
    /** The trail this view is bound to. */
    readonly trailId: TrailId;
    /** Whether the bound trail is sampled in (false -> every call is a no-op). */
    readonly sampled: boolean;
    /** Open a probe at the trail root level; returns its handle. */
    open(kind: ProbeKind, name: string, attributes?: ProbeAttributes): ProbeHandle;
    /** Open a probe under the given parent probe id; returns its handle. */
    child(parentId: ProbeId, kind: ProbeKind, name: string, attributes?: ProbeAttributes): ProbeHandle;
}
/**
 * The token a {@link SecretRedactor} substitutes for a removed value.
 *
 * A single, distinctive sentinel so redacted output is greppable and never
 * collides with a plausible real value.
 */
export declare const REDACTED_TOKEN: "[insight:scrubbed]";
/** The literal type of {@link REDACTED_TOKEN}. */
export type RedactedToken = typeof REDACTED_TOKEN;
/**
 * A single redaction rule.
 *
 * A rule fires when either the attribute *key* matches {@link RedactionRule.key}
 * (case-insensitive substring or regex) or a string *value* matches
 * {@link RedactionRule.value}; the matched span is replaced with the
 * {@link REDACTED_TOKEN}. Rules are evaluated in order and are additive.
 */
export interface RedactionRule {
    /** A label for diagnostics (e.g. `"bearer-token"`). */
    readonly id: string;
    /** Matches against attribute keys; a string is a case-insensitive substring. */
    readonly key?: string | RegExp;
    /** Matches against string values; the matched run is replaced. */
    readonly value?: RegExp;
}
/**
 * Options that bound a {@link SecretRedactor}.
 */
export interface RedactionOptions {
    /** Hard cap on retained string length; longer values are truncated. */
    readonly maxStringLength?: number;
    /** Attribute keys dropped entirely rather than tokenized. */
    readonly omitKeys?: readonly string[];
}
/**
 * The attribute-processor contract applied before signals reach a sink.
 *
 * A {@link SecretRedactor} owns the agent's own patterns ({@link RedactionRule}s)
 * and the {@link REDACTED_TOKEN}. The pipeline calls {@link SecretRedactor.scrub}
 * on every probe carried by a {@link Signal}; the redactor returns a new probe
 * with a scrubbed attribute bag and a scrubbed {@link ProbeFault}, leaving the
 * original frozen value untouched.
 */
export interface SecretRedactor {
    /** The rules this redactor applies, in evaluation order. */
    readonly rules: readonly RedactionRule[];
    /** Scrub a single value (string / object / array), recursively. */
    scrubValue(value: unknown): unknown;
    /** Scrub a probe's attribute bag, returning a new frozen bag. */
    scrubAttributes(attributes: ProbeAttributes): ProbeAttributes;
    /** Scrub a whole probe (attributes + fault), returning a new frozen probe. */
    scrub(probe: Probe): Probe;
}
/**
 * A redactor that performs no redaction.
 *
 * The frozen identity processor used when redaction is disabled: every method
 * returns its input unchanged. Distinct from a configured {@link SecretRedactor}
 * with an empty rule set only in intent — both are safe defaults.
 */
export declare const PASSTHRU_REDACTOR: SecretRedactor;
