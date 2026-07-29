/**
 * Operation registry — the single declarative source both halves of the link
 * consume.
 */
import { defineOps, OP_ERROR } from "./contract.js";
import type { ChannelContext, Op, OpRegistry } from "./contract.js";

export { defineOps };

export class UnknownOpError extends Error {
  readonly code: number;
  readonly method: string;

  constructor(method: string) {
    super("Unknown op: " + method);
    this.name = "UnknownOpError";
    this.method = method;
    this.code = OP_ERROR.unknownOp;
  }
}

/**
 * Run one operation by name against the shared context.
 */
export async function dispatch(
  registry: OpRegistry,
  method: string,
  params: unknown,
  ctx: ChannelContext,
): Promise<unknown> {
  const op = registry[method];
  if (op === undefined) {
    throw new UnknownOpError(method);
  }
  return op.handle(params, ctx);
}

export function hasOp(registry: OpRegistry, method: string): boolean {
  return Object.prototype.hasOwnProperty.call(registry, method);
}

export function methodsOf<T extends OpRegistry>(registry: T): ReadonlyArray<keyof T & string> {
  return Object.keys(registry).sort() as ReadonlyArray<keyof T & string>;
}

export interface OpRegistryHandle<T extends OpRegistry> {
  readonly registry: T;
  readonly methods: ReadonlyArray<keyof T & string>;
  dispatch(method: string, params: unknown, ctx: ChannelContext): Promise<unknown>;
}

/**
 * Build an {@link OpRegistryHandle} from a record of operation declarations.
 */
export function buildOps<T extends Record<string, Op<any, any>>>(
  ops: T,
): OpRegistryHandle<Readonly<T>> {
  const registry = defineOps(ops);
  return Object.freeze({
    registry,
    methods: methodsOf(registry),
    dispatch: (method: string, params: unknown, ctx: ChannelContext): Promise<unknown> =>
      dispatch(registry, method, params, ctx),
  });
}