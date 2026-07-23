// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Session overlays — the transcript navigation dialogs.
 *
 * This group owns the three modal kinds that browse persisted or in-flight
 * transcript state: the session resume/list picker (`sessions`), the
 * transcript-tree navigator (`tree`), and the prior-user-turn picker
 * (`userTurns`) used when branching or forking. It is mounted unconditionally
 * by {@link import("./host").OverlayHost}, which routes by
 * {@link ModalState.kind}; this component renders a dialog body only for one of
 * its own kinds and is otherwise inert.
 *
 * Each body maps the app's session vocabulary onto the framework dialog prop
 * shapes: a {@link import("../../sessions").SavedSession} becomes a
 * `SessionInfo`, a {@link import("../../sessions").BranchNode} becomes a
 * `SessionTreeOption`, and a {@link import("../../sessions").PriorTurn} becomes
 * a `UserMessageOption`. Async catalog/tree/turn loads run in `useEffect`; every
 * confirm drives the matching service then closes the modal. When the runtime
 * {@link OverlayServices} bundle is absent, the group renders nothing.
 */
import type { OverlayGroupProps } from "./pickers";
/**
 * The session overlay group: sessions, tree, and prior-turn pickers.
 *
 * Renders the dialog body matching the active modal kind, or nothing for a kind
 * this group does not own (or when no runtime services are wired in).
 *
 * @param props the forwarded overlay props (modal, services, theme, dispatch, closer)
 */
export declare function SessionOverlays(props: OverlayGroupProps): JSX.Element | null;
