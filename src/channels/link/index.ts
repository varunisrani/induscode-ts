// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Link channel — public barrel.
 *
 * The link channel is the long-lived, bidirectional half of the channels
 * subsystem: a JSON-RPC 2.0 server that dispatches framed requests through an
 * {@link OpRegistry} (`server.ts`), a generated {@link LinkDriver} client built
 * from a {@link Proxy} rather than hand-written methods (`driver.ts`), and the
 * ask / tell dialog bridge that both ends share (`dialog.ts`). Consumers import
 * the link surface from `src/channels/link` rather than the individual modules.
 */
export {
  createLinkServer,
  type LinkServer,
  type LinkServerIo,
  type LinkServerConfig,
} from "./server.js";
export {
  createLinkDriver,
  LinkRequestError,
  type LinkDriverHandle,
  type LinkDriverIo,
  type LinkDriverConfig,
} from "./driver.js";
export {
  createDialogBridge,
  makeDialogMethods,
  DIALOG_TABLE,
  type LinkedDialogBridge,
  type DialogBridgeDeps,
  type DialogSpec,
  type DialogMethods,
} from "./dialog.js";
