// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Channels subsystem — public barrel.
 *
 * Re-exports the FROZEN Phase-8 contract: the JSON-RPC 2.0 envelope
 * ({@link OpRequest}, {@link Reply}, {@link OpError}), the declarative operation
 * registry ({@link Op}, {@link OpRegistry}, {@link defineOps}) and the type that
 * the typed client is generated from ({@link LinkDriver}), the NDJSON framer
 * surface ({@link NdjsonFramer} / {@link EncodeLine} / {@link DecodeLines}), the
 * dialog primitives ({@link Ask} / {@link Tell} / {@link DialogBridge}), the
 * {@link ChannelContext}, the wire session projection ({@link LinkSnapshot}), and
 * the oneshot channel shapes ({@link OneshotRequest} / {@link OneshotStrategy}).
 *
 * Behavior modules (the oneshot runner, the link server, the generated driver,
 * the NDJSON framer, and the dialog bridge) are added to this barrel as they
 * land; consumers import the channel surface from `src/channels` rather than
 * reaching into individual modules.
 */
export type { ProtocolVersion, RequestId, OpRequest, OpError, ReplyOk, ReplyErr, Reply, WritableLine, ReadableChunks, EncodeLine, DecodeLines, NdjsonFramer, Ask, AskAnswer, Tell, DialogBridge, ChannelContext, Op, OpRegistry, OpParams, OpResult, LinkDriver, LinkSnapshot, Signal, OneshotShape, OneshotRequest, OneshotStrategy, ChannelTimings, DriverOptions, ServerOptions, ImageContent, SessionConductor, ConductorState, ThinkingLevel, Usage, } from "./contract";
export { PROTOCOL_VERSION, OP_ERROR, REQUEST_ID_PREFIX, DEFAULT_CHANNEL_TIMINGS, isReplyOk, defineOps, } from "./contract";
export { encodeLine, decodeLines, ndjsonFramer } from "./framer";
export { dispatch, hasOp, methodsOf, buildOps, UnknownOpError, type OpRegistryHandle, } from "./ops";
export { runOneshot, inertDialog } from "./oneshot";
export { SESSION_OPS, projectSnapshot, type SessionOps, type SubmitParams, type ResumeParams, type CycleModelParams, type ModelEntry, } from "./session-ops";
export { createLinkServer, createLinkDriver, createDialogBridge, makeDialogMethods, DIALOG_TABLE, LinkRequestError, type LinkServer, type LinkServerIo, type LinkServerConfig, type LinkDriverHandle, type LinkDriverIo, type LinkDriverConfig, type LinkedDialogBridge, type DialogBridgeDeps, type DialogSpec, type DialogMethods, } from "./link";
