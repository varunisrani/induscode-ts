// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Runtime-bridge subsystem — public barrel.
 *
 * Re-exports the FROZEN provider-routing contract: the external-runtime
 * annotation ({@link ExternalRuntimeSpec} + the `bridge:<adapter>` endpoint
 * convention), the provider-neutral {@link NormalizedEvent} union, the single
 * {@link BridgeEventSink} push-stream helper, the injectable
 * {@link ChildTransport} boundary, and the routing surface itself
 * ({@link RuntimeBridge}, {@link RuntimeBroker}, {@link RuntimeRoute}).
 *
 * Behavior modules (the concrete bridges under `bridges/`, the sink
 * implementation, the broker) are added to this barrel as they land; consumers
 * import the routing surface from `src/runtime-bridge` rather than reaching into
 * individual modules.
 */
export type { RuntimeAdapterId, RuntimeAuthMode, ExternalRuntimeSpec, RuntimeEndpointScheme, NormalizedEvent, NormalizedEventKind, NormalizedEventOf, FinishReason, BridgeFailure, BridgeEventSink, ChildMessage, ChildRequest, ChildTransport, ExchangeOptions, RuntimeBridge, RuntimeBroker, RuntimeRoute, Api, AssistantMessage, AssistantMessageEventStream, Context, KnownProvider, Model, SimpleStreamOptions, StopReason, ToolCall, } from "./contract";
export { RUNTIME_ENDPOINT_SCHEME, runtimeEndpoint } from "./contract";
export type { BridgeMessageSeed } from "./sink";
export { createBridgeSink } from "./sink";
export { claudeCliBridge, codexCliBridge, indusagiCliBridge, makeIndusagiCliBridge, BUILTIN_RUNTIME_SPECS, BUILTIN_ADAPTERS, builtinRuntimeSpec, annotateCard, withRuntimeEndpoint, specFromModel, type RuntimeAnnotatedModel, driveExchange, seedFromModel, type ChildParser, type ParseStep, } from "./bridges";
export { createRuntimeBroker, runtimeSourceKey, RUNTIME_LINK_ENTRY, type RuntimeBrokerRuntime, type RuntimeBrokerDeps, type ChildTransportFactory, type TransportContext, type FrameworkStream, type RuntimeLink, type RuntimeLinkStore, type RuntimeLinkEntryTag, type ResumeEvent, } from "./broker";
