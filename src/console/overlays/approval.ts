// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Approval overlay — the interactive tool-permission prompt.
 *
 * This group owns the single modal kind raised when the permission gate reaches an
 * `ask` decision for a tool call: it shows the pending request (tool name, a short
 * rendering of the arguments, and any suggested allow-rule) and lets the user pick
 * one of three outcomes — allow this one call, allow it for the rest of the session
 * (which the gate turns into a session allow-rule), or deny it. It is mounted
 * unconditionally by {@link import("./host").OverlayHost}, which routes by
 * {@link ModalState.kind}; this component renders a dialog body only for its own
 * `approval` kind and is otherwise inert.
 *
 * The wiring is a parked promise: when the React layer builds the conductor's
 * approval resolver it returns a promise and stashes the request (plus the
 * promise's `resolve`) under {@link ModalState.payload}. This overlay reads that
 * payload, renders the choices, and on a pick calls `payload.resolve(choice)` then
 * closes the modal — handing control back to the gate, which proceeds or denies. An
 * Esc (the dialog's own close) resolves `"deny"` so a dismissed prompt never hangs
 * the in-flight turn. The actual select UI reuses the framework `ThemeDialog`
 * (a labelled, navigable pick-from-list with descriptions), so the overlay needs no
 * bespoke key handling.
 *
 * React/Ink are obtained the same way the other overlays do (default React export
 * from `indusagi/react-host`, `Box`/`Text` from `indusagi/react-host/ink`).
 */
import { type ThemeDialogItem } from "indusagi/react-ink";
import type { ApprovalChoice } from "../../conductor";
import type { OverlayGroupProps } from "./pickers";
/**
 * The pending tool-permission request a prompt is raised for. Mirrors the
 * arguments the conductor's approval resolver is handed for an `ask` decision.
 */
export interface ApprovalRequest {
    /** The tool the model asked to run (e.g. `"Bash"`, `"Edit"`). */
    readonly toolName: string;
    /** The validated arguments the tool would run with. */
    readonly input: unknown;
    /**
     * Optional human-readable allow-rule suggestions the prompt surfaces (e.g.
     * `"Bash(npm run test:*)"`), so the user knows what an "allow always" remembers.
     */
    readonly suggestions?: readonly string[];
}
/**
 * The opaque {@link ModalState.payload} the `approval` overlay narrows: the pending
 * request plus the resolver of the parked approval promise. The overlay calls
 * `resolve(choice)` exactly once, then closes the modal.
 */
export interface ApprovalPayload {
    /** The pending request to render. */
    readonly request: ApprovalRequest;
    /** Fulfil the parked approval promise with the user's choice. */
    readonly resolve: (choice: ApprovalChoice) => void;
}
/**
 * The three offerable outcomes, in listing order. The `id` is the
 * {@link ApprovalChoice} the gate consumes; `label`/`description` are what the
 * prompt shows. Kept as data (not an `if`-ladder) so the choice→resolution mapping
 * is a pure table the headless test asserts against.
 */
export declare const APPROVAL_CHOICES: readonly (ThemeDialogItem & {
    id: ApprovalChoice;
})[];
/** The {@link ApprovalChoice} a dismissed (Esc) prompt resolves to. */
export declare const DISMISS_CHOICE: ApprovalChoice;
/**
 * Map a selected dialog `id` back to the {@link ApprovalChoice} the gate consumes.
 *
 * Pure and total: a recognised id maps to itself; anything unrecognised falls back
 * to {@link DISMISS_CHOICE} (`"deny"`) so a stray selection can never silently
 * allow a tool. This is the unit the headless test pins.
 *
 * @param id the `id` the {@link ThemeDialog} reported on select
 */
export declare function choiceFromId(id: string): ApprovalChoice;
/**
 * Narrow the opaque modal payload into a typed {@link ApprovalPayload}, or
 * `undefined` when it is not a well-formed approval request (a defensive guard —
 * the overlay renders nothing rather than crash on a malformed payload).
 *
 * @param payload the opaque {@link ModalState.payload}
 */
export declare function readApprovalPayload(payload: unknown): ApprovalPayload | undefined;
/**
 * Render a tool call's arguments as a single short, human-readable line for the
 * prompt body. A shell `command` (or any `command` field) shows verbatim;
 * otherwise a compact JSON encoding is used. Long values are elided so the prompt
 * never floods the terminal.
 *
 * @param input the validated tool arguments
 */
export declare function summarizeInput(input: unknown): string;
/**
 * The approval overlay group: the single `approval` modal kind.
 *
 * Renders the prompt body when the active modal is `approval` and its payload is a
 * well-formed {@link ApprovalPayload}; every other kind (and a malformed payload)
 * yields nothing. Unlike the session/auth groups this does NOT require the runtime
 * services bundle — the payload carries everything the prompt needs — so it works
 * on any mount path that wired a resolver.
 *
 * @param props the forwarded overlay props (modal, services, theme, dispatch, closer)
 */
export declare function ApprovalOverlays(props: OverlayGroupProps): JSX.Element | null;
