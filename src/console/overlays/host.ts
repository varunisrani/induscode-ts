// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * OverlayHost — the single mount point for every modal overlay.
 *
 * The console surface raises overlays by writing a {@link ModalState} into the
 * reducer; this component is the one place that turns that state into a rendered
 * dialog. Rather than a hand-written `switch` over {@link ModalKind}, it mounts
 * three group components unconditionally and forwards each the same props — the
 * active {@link ModalState}, the {@link OverlayServices} runtime, the theme
 * adapter, the {@link ConsoleDispatch}, and a `closeModal` callback. Each group
 * owns a disjoint slice of the kind space and renders a body only for its own
 * kinds:
 *
 *   - {@link PickerOverlays}   — `models`, `scopedModels`, `theme`, `settings`.
 *   - {@link SessionOverlays}  — `sessions`, `tree`, `userTurns`.
 *   - {@link AuthOverlays}     — `signIn`, `signOut`, `oauth`, `plugin`.
 *   - {@link ApprovalOverlays} — `approval` (the tool-permission prompt).
 *
 * When no overlay is raised (`kind === "none"`) the host renders nothing, so the
 * composer keeps focus and the groups are never mounted needlessly.
 */
import type { ConsoleDispatch, InkThemeAdapter, ModalState, OverlayServices } from "../contract";
/**
 * The props the console surface threads into {@link OverlayHost}.
 *
 * The same five fields are forwarded verbatim to each overlay group; the host
 * adds no routing logic of its own beyond the `none` short-circuit.
 */
export interface OverlayHostProps {
    /** The active modal overlay (kind + opaque payload). */
    readonly modal: ModalState;
    /** The runtime handles overlays drive; absent on headless mount paths. */
    readonly services?: OverlayServices;
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** Dispatch a reducer event to mutate console state. */
    readonly dispatch: ConsoleDispatch;
    /** Drop the active overlay back to the composer. */
    readonly closeModal: () => void;
}
/**
 * Render the active modal overlay, or nothing when none is raised.
 *
 * @param props the modal state, runtime services, theme, dispatch, and closer
 */
export declare function OverlayHost(props: OverlayHostProps): JSX.Element | null;
