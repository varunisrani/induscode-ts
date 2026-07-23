// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Saffron picker boards — the themed `/settings` and `/model` overlays styled to
 * the "IndusCode Saffron · Settings · Config" design.
 *
 * The framework ships plain (un-themed) `SettingsDialog` / `ModelDialog`. These
 * boards are the console's own theme-aware replacements for those two pickers: a
 * saffron tab-pill header, a teal-bordered search box with a magnifier and a
 * block caret, a two-column list whose values are tinted by kind (on/true →
 * green, off/false → dim, everything else → teal), a windowed "↓ N more" hint,
 * and a top-ruled footer of key hints. They reuse the framework's pure
 * {@link matchesSearchQuery} / {@link wrapSelectionIndex} helpers (and the
 * {@link SettingsDialogItem} shape) so only the *presentation* is re-authored,
 * not the filter/navigation logic.
 *
 * All colour comes through the framework {@link InkThemeAdapter} the overlay
 * group already holds, so the boards recolour with the active scheme; the one
 * raw-hex touch is the chalk tab-pill (dark text on the accent fill), which has
 * no theme role to resolve against.
 */
import { type InkThemeAdapter, type SettingsDialogItem } from "indusagi/react-ink";
import type { Model } from "indusagi/ai";
/** What the {@link SettingsBoard} renders. */
export interface SettingsBoardProps {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** The settings rows to present and cycle. */
    readonly items: readonly SettingsDialogItem[];
    /** Invoked when the board is dismissed. */
    readonly onClose: () => void;
}
/**
 * The saffron `/settings` board: a filterable, value-cycling settings list in the
 * design's look. Up/Down move (wrapping), Left/Right or Enter cycle the value,
 * typing filters, Ctrl+U clears, Esc closes.
 */
export declare function SettingsBoard({ theme, items, onClose }: SettingsBoardProps): JSX.Element;
/** What the {@link ModelBoard} renders. */
export interface ModelBoardProps {
    /** The framework adapter that turns token roles into terminal colours. */
    readonly theme: InkThemeAdapter;
    /** The selectable models. */
    readonly models: readonly Model<any>[];
    /** Optional initial search query. */
    readonly search?: string;
    /** Invoked with the chosen model. */
    readonly onSelect: (model: Model<any>) => void | Promise<void>;
    /** Invoked when the board is dismissed. */
    readonly onClose: () => void;
}
/**
 * The saffron `/model` board: a filterable model list in the design's look.
 * Up/Down move (wrapping), Enter selects, typing filters, Ctrl+U clears, Esc
 * closes.
 */
export declare function ModelBoard({ theme, models, onClose, onSelect, search }: ModelBoardProps): JSX.Element;
