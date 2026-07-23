// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Console subsystem — public barrel.
 *
 * Re-exports the FROZEN interactive-UI contract: the immutable reducer state
 * ({@link ConsoleState}) and its action union ({@link ConsoleEvent}), the
 * transcript view rows ({@link ViewRow}), the modal/overlay state machine
 * ({@link ModalKind}, {@link ModalState}, {@link transitionModal}), the theme
 * vocabulary ({@link ThemeScheme}, {@link ThemeTokens}, {@link ThemePalette},
 * {@link ConsoleTheme}), the data-driven slash registry ({@link SlashCommand},
 * {@link SlashRegistry}, {@link SlashContext}), and the root surface props
 * ({@link ConsoleProps}, {@link ConsoleHost}).
 *
 * Behavior modules (the reducer, the theme adapter binding, the slash registry,
 * the keymap, the completion engine, the paste coalescer, and the surface
 * components) are added to this barrel as they land; consumers import the
 * console surface from `src/console` rather than reaching into individual
 * modules.
 */
export type { ThemeScheme, ThemeTokens, ThemeToken, ThemePalette, ConsoleTheme, ViewRowKind, ViewRow, ModalKind, ModalState, ConsoleState, ConsoleEvent, ConsoleEventType, ConsoleEventOf, ConsoleReducer, ConsoleDispatch, SlashOutcome, SlashContext, SlashCommand, SlashRegistry, ConsoleProps, ConsoleHost, Themed, RenderSlot, SessionSnapshot, ToolExecutionState, StatusMessage, UiDisplayBlock, InkThemeAdapter, SessionConductor, SessionSignal, ConductorState, } from "./contract";
export { DEFAULT_SCHEME, isThemeScheme, NO_MODAL, transitionModal, EMPTY_CONSOLE_STATE, } from "./contract";
export { consoleReducer, initConsoleState } from "./reducer";
export { THEMES, THEME_SCHEMES, resolveTheme, MIDNIGHT_PALETTE, DAYLIGHT_PALETTE, PALETTES, deriveTokens, themeAdapter, frameworkColors, } from "./theme";
export { SLASH_COMMANDS, FAMILY, DEFAULT_SLASH_REGISTRY, buildRegistry, tokensOf, findCommand, matchPrefix, listFamilies, commandsInFamily, SLASH_PREFIX, looksLikeSlash, parseSlash, resolveSlash, type SlashLine, type SlashResolution, } from "./slash";
export { NO_INTENT, readKey, NO_CHORD, advanceChord, type KeyChord, type ConsoleVerb, type ConsoleIntent, type ChordOutcome, type ChordLatch, type ChordStep, PASTE_THRESHOLDS, PASTE_BURST_GAP_MS, EMPTY_PASTE_VAULT, pasteMarker, classifyPaste, coalescePaste, expandMarkers, hasMarkers, type PasteThresholds, type PasteVault, type PasteCapture, completeAt, applySuggestion, type CompletionKind, type Suggestion, type TokenSpan, type CompletionResult, type DirEntry, type DirReader, } from "./input";
export { TerminalConsole } from "./components/TerminalConsole";
export { Composer, type ComposerProps } from "./components/Composer";
export { StatusBar, type StatusBarProps } from "./components/StatusBar";
export { Banner, type BannerProps } from "./components/Banner";
export { BackgroundAgents, deriveAgentRuns, type BackgroundAgentsProps, type AgentRun, type AgentRunStatus, } from "./components/BackgroundAgents";
export { AgentsView, type AgentsViewProps } from "./components/AgentsView";
export { MASCOTS, TIPS, WHATS_NEW, mascotRows, pickWelcomeVariant, randomWelcomeSeed, type MascotFace, type MascotTone, type MascotSegment, type WelcomeVariant, } from "./components/welcome";
export { gatherStartup, gatherChangelog } from "./startup";
export type { StartupMap, StartupSection, StartupChangelog, StartupChangelogMode, StartupNotice, StartupNoticeKind, StartupInputs, } from "./startup";
export { mountConsole, type MountConsoleOptions, type MountResult, } from "./mount";
