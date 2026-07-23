// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Auth overlays — the sign-in / sign-out and plugin dialogs.
 *
 * This group owns the four modal kinds tied to credentials and host-supplied
 * overlays: the provider sign-in launcher (`signIn`), the sign-out confirmation
 * (`signOut`), the in-flight OAuth device/redirect flow (`oauth`), and a
 * plugin-supplied select/confirm/input/custom overlay (`plugin`). It is mounted
 * unconditionally by {@link import("./host").OverlayHost}, which routes by
 * {@link ModalState.kind}; this component renders a dialog body only for one of
 * its own kinds and is otherwise inert.
 *
 * Each kind drives an {@link OverlayServices} handle then returns to the
 * composer: `signIn` enumerates the merged provider directory and hands a
 * browser provider off to the `oauth` kind (api-key providers post a status and
 * close); `signOut` lists the saved accounts across providers and removes the
 * chosen one through the vault; `oauth` runs the framework login flow, threading
 * its url/prompt/progress callbacks into a local overlay state the dialog reads;
 * `plugin` presents the host-supplied surface name and closes. React/Ink are
 * obtained the same way the surface component is (default React export from
 * `indusagi/react-host`, `Box`/`Text` from `indusagi/react-host/ink`).
 */
import type { OverlayGroupProps } from "./pickers";
/**
 * The auth overlay group: sign-in, sign-out, OAuth, and plugin overlays.
 *
 * Renders a dialog body only when the active modal kind is one of this group's
 * own; every other kind (and an absent {@link OverlayServices}) yields nothing.
 *
 * @param props the forwarded overlay props
 */
export declare function AuthOverlays(props: OverlayGroupProps): JSX.Element | null;
