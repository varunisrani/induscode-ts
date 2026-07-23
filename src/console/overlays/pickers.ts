// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Picker overlays — the selection dialogs raised over the transcript.
 *
 * This group owns the four modal kinds that present a list to pick from: the
 * single-model picker (`models`), the per-scope model picker (`scopedModels`),
 * the colour-scheme picker (`theme`), and the settings list (`settings`). It is
 * mounted unconditionally by {@link import("./host").OverlayHost}; the host
 * routes by {@link ModalState.kind}, so this component only renders a dialog
 * body for one of its own kinds and is otherwise inert.
 */
import type { ConsoleDispatch, InkThemeAdapter, ModalState, OverlayServices } from "../contract";
/**
 * The props every overlay group receives, forwarded verbatim from
 * {@link import("./host").OverlayHost}.
 */
export interface OverlayGroupProps {
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
 * The picker overlay group: models, scoped models, theme, and settings.
 *
 * Renders the framework dialog matching the active modal kind, and nothing for
 * any kind owned by another group. With no runtime services attached (headless
 * and test mounts) every kind renders nothing.
 *
 * @param props the forwarded overlay props
 */
export declare function PickerOverlays(props: OverlayGroupProps): JSX.Element | null;
