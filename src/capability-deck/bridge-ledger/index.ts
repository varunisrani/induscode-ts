// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Bridge-ledger — public barrel for event-sourced MCP tool enrollment.
 *
 * Three concerns, one import site:
 *
 *   - **Keys** (`./key`) — content-addressed and ULID {@link BridgeKey} minting,
 *     so re-enrolling the same external tool is an idempotent upsert.
 *   - **Ledger** (`./ledger`) — the immutable {@link BridgeLedger} value and its
 *     pure transitions: {@link enrollBridgeCard} (upsert), {@link retire} /
 *     {@link withdrawServer} (splice), each returning a new ledger folded by the
 *     contract's {@link reduceLedger}.
 *   - **Network** (`./network`) — {@link attachBridgeCapabilities}, which mounts
 *     external MCP servers through the framework's `mountProtocolBridge`, adapts
 *     the returned `ToolBox` into {@link Capability} objects + {@link
 *     CapabilityCard}s, and enrolls them into a ledger.
 *
 * The frozen shapes ({@link BridgeKey}, {@link BridgeEntry}, {@link
 * LedgerSnapshot}, {@link reduceLedger}) continue to live in the deck contract;
 * this module re-exports the behavior that operates on them.
 */
export { qualifyBridgeName, bridgeContentKey, bridgeUlidKey, } from "./key";
export type { BridgeLedger, EnrollRequest } from "./ledger";
export { emptyBridgeLedger, bridgeLedgerFromLog, enrollBridgeCard, retire, withdrawServer, liveCapabilities, liveCapabilitiesForServer, } from "./ledger";
export type { AttachResult } from "./network";
export { attachBridgeCapabilities, detachBridge, bridgeBoxToCapabilities, bridgeCapabilityCard, bridgeConfig, } from "./network";
