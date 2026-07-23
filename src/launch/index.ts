// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Launch subsystem — public barrel.
 *
 * Re-exports the frozen Phase-10 contract surface: the parsed
 * {@link Invocation} and its {@link OutputMode} / {@link ThinkingEffort} /
 * {@link ToolName} vocabularies, the declarative {@link FlagSpec} table types,
 * the gathered {@link Attachments} shape, the typed {@link CredentialFault}
 * union and its {@link AuthVault} seam, the model-catalog filter, and the resume
 * / settings-browser option shapes. Behavior modules (the reader, the usage
 * renderer, the credential command, the attachment gatherer, the catalog
 * printer, the resume picker, the settings browser) attach their exports here as
 * they land, so consumers import the launch surface from `src/launch` rather
 * than reaching into individual modules.
 */
export type { OutputMode, ThinkingEffort, ToolName, FlagKind, FlagDefault, FlagSpec, Invocation, FlagValue, Attachments, AttachmentOptions, CredentialVerb, ProviderEntry, CredentialFaultKind, CredentialFault, AuthVault, CredentialCommandOptions, CatalogFilter, SessionLoader, ResumeFault, SettingsBrowseOptions, ResumeRef, ThinkingLevel, SessionListProgress, ImageContent, KnownProvider, ModelRegistry, OAuthCredentials, Settings, RunnerId, } from "./contract";
export { THINKING_EFFORTS, TOOL_NAMES, isThinkingEffort, isOutputMode, isToolName, credentialFault, } from "./contract";
export { FLAG_SPECS, FLAG_GROUPS, readInvocation, readFileReferences, renderUsage, gatherAttachments, AttachmentError, } from "./invocation";
export type { FlagGroup, GroupedFlagSpec, AttachmentErrorKind, } from "./invocation";
export { runPackageCommand, defaultPackageIo, PACKAGE_COMMANDS, } from "./packages";
export type { PackageCommand, PackageIo, PackageCommandOptions, PackageResult, } from "./packages";
export { runCredentialCommand, defaultCredentialIo, formatCredentialFault, validateApiKey, validateAccountName, findProvider, isOAuthCapable, asSigninMethod, PROVIDER_DIRECTORY, } from "./credentials";
export type { CredentialIo, CredentialResult, SigninMethod } from "./credentials";
export { registerBuiltInOAuthProviders, listLoginProviders, startOAuthLogin, openLoginUrl, hasRegisteredOAuthClientId, } from "./oauth";
export type { AuthKind, LoginProvider, OAuthLoginResult, } from "./oauth";
export { printModelCatalog, defaultCatalogIo, registrySource } from "./catalog";
export type { CatalogIo, CatalogModelSource } from "./catalog";
export { pickResumeTarget, browseSettings, mergeSessions, renderSettingsListing, defaultResumeDeps, defaultSettingsBrowseIo, } from "./pickers";
export type { ResumeDeps, ResumeOutcome, SettingsBrowseIo, } from "./pickers";
