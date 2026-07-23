// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * StatusBar — the bottom chrome strip of the console.
 *
 * Composes the framework's `StatusLine` (the transient toast row) above its
 * `Footer` (the persistent session/usage strip), both fed from a projected
 * {@link SessionSnapshot}. The console owns no rendering of its own here — it
 * threads the resolved theme adapter and the current snapshot/status into the
 * framework components, which do the layout. Purely presentational.
 *
 * (Renamed surface: the console's status strip.)
 */
import { type InkThemeAdapter, type SessionSnapshot, type StatusMessage } from "indusagi/react-ink";
import type { PermissionMode } from "../../settings";
/** What the {@link StatusBar} renders. */
export interface StatusBarProps {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** The projected session snapshot the framework strips read. */
    readonly snapshot: SessionSnapshot;
    /** The active VCS branch, or `null` when not in a repo. */
    readonly branch: string | null;
    /** How many auth providers are available (shown in the footer). */
    readonly providerCount: number;
    /** The transient status toast, when one is showing. */
    readonly status?: StatusMessage;
    /**
     * The active permission mode. When supplied, a small badge is rendered above the
     * footer (parallel to the transient status toast) so the user can see at a glance
     * which of the four cycled modes is live: `default` (tools prompt as usual),
     * `acceptEdits` (edits auto-approved), `plan` (mutating tools blocked), or
     * `bypass` (every tool auto-allowed — drawn in an alert colour). The
     * `bypassPermissions` alias renders as `bypass`. Omitted renders nothing extra.
     */
    readonly permissionMode?: PermissionMode;
}
/**
 * Render the toast row above the footer strip, plus an optional permission-mode
 * badge when a non-default mode is active.
 *
 * @param props the snapshot + status (+ optional permission mode) to display
 */
export declare function StatusBar({ theme, snapshot, branch, providerCount, status, permissionMode, }: StatusBarProps): JSX.Element;
