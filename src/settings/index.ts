// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Settings subsystem — public barrel.
 *
 * One import site for the typed {@link Preferences} record and its
 * {@link SettingKey} / {@link EscapeAction} / {@link ThinkingLevel}
 * vocabularies, the frozen {@link DEFAULT_PREFERENCES}, and the two-tier
 * {@link PreferenceStore} reader/writer. Console surfaces and boot stages depend
 * on this module rather than reaching into the individual files.
 */
export type { Preferences, SettingKey, EscapeAction, DeliveryMode, ThinkingLevel, PermissionMode, PermissionSettings, } from "./contract";
export { DEFAULT_PREFERENCES, SETTING_KEYS, ESCAPE_ACTIONS, isEscapeAction, DELIVERY_MODES, isDeliveryMode, PERMISSION_MODES, isPermissionMode, } from "./contract";
export { PreferenceStore } from "./manager";
export type { PreferenceLocations } from "./manager";
