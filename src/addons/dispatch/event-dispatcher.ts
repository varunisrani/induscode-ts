/**
 * EventDispatcher — the single fan-out / transform / veto engine for the unified
 * colon-named event taxonomy.
 */
import {
  addonFault,
  type AddonFault,
  type AddonFaultListener,
  type AddonId,
  type DispatchOutcome,
  type EventDispatcher,
  type EventSubscription,
  type HookEvent,
  type HookHandler,
} from "../contract.js";

interface EventTrait {
  guards: boolean;
}

const EVENT_TRAITS: Readonly<Record<HookEvent, EventTrait>> = Object.freeze({
  "session:start": { guards: false },
  "session:end": { guards: false },
  "turn:start": { guards: false },
  "turn:end": { guards: false },
  "tool:before": { guards: true },
  "tool:after": { guards: false },
  "chat:params": { guards: false },
  "chat:message": { guards: false },
  "shell:env": { guards: false },
  "input:submit": { guards: true },
  "context:build": { guards: false },
  "compact:build": { guards: false },
  "compact:before": { guards: true },
});

const RESERVED_EVENTS: ReadonlySet<HookEvent> = new Set(
  (Object.keys(EVENT_TRAITS) as HookEvent[]).filter(
    (event) => EVENT_TRAITS[event].guards,
  ),
);

function groupByEvent(
  subscriptions: readonly EventSubscription[],
): Map<HookEvent, EventSubscription[]> {
  const grouped = new Map<HookEvent, EventSubscription[]>();
  for (const sub of subscriptions) {
    const list = grouped.get(sub.event);
    if (list === undefined) {
      grouped.set(sub.event, [sub]);
    } else {
      list.push(sub);
    }
  }
  return grouped;
}

export class AddonEventDispatcher implements EventDispatcher {
  private readonly byEvent: Map<HookEvent, EventSubscription[]>;
  private readonly faultListeners: Set<AddonFaultListener>;

  constructor(subscriptions: readonly EventSubscription[]) {
    this.byEvent = groupByEvent(subscriptions);
    this.faultListeners = new Set();
  }

  static from(subscriptions: readonly EventSubscription[]): AddonEventDispatcher {
    return new AddonEventDispatcher(subscriptions);
  }

  get reserved(): ReadonlySet<HookEvent> {
    return RESERVED_EVENTS;
  }

  async dispatch<TPayload>(
    event: HookEvent,
    payload: TPayload,
  ): Promise<DispatchOutcome<TPayload>> {
    const subscriptions = this.byEvent.get(event);
    if (subscriptions === undefined || subscriptions.length === 0) {
      return { payload };
    }
    let current = payload;
    for (const sub of subscriptions) {
      const gate = await this.run(event, sub, current, (next) => {
        current = next;
      });
      if (gate !== undefined && gate.stop) {
        return { payload: current, gate };
      }
    }
    return { payload: current };
  }

  has(event: HookEvent): boolean {
    const subscriptions = this.byEvent.get(event);
    return subscriptions !== undefined && subscriptions.length > 0;
  }

  onFault(listener: AddonFaultListener): () => void {
    this.faultListeners.add(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.faultListeners.delete(listener);
    };
  }

  private async run<TPayload>(
    event: HookEvent,
    sub: EventSubscription,
    payload: TPayload,
    commit: (next: TPayload) => void,
  ): Promise<{ stop: boolean } | undefined> {
    const handler = sub.handler;
    try {
      switch (handler.kind) {
        case "observe": {
          await handler.run(payload);
          return undefined;
        }
        case "transform": {
          const next = await handler.run(payload);
          commit(next);
          return undefined;
        }
        case "gate": {
          const decision = await handler.run(payload);
          return decision ?? undefined;
        }
      }
    } catch (cause) {
      this.report(
        addonFault("handler", `Handler for "${event}" threw during dispatch.`, {
          addon: sub.addon,
          cause,
        }),
      );
      return undefined;
    }
  }

  private report(fault: AddonFault): void {
    for (const listener of [...this.faultListeners]) {
      try {
        listener(fault);
      } catch {
        /* ignore listener errors */
      }
    }
  }
}

/**
 * Record one event subscription, stamping it with the owning addon.
 */
export function subscription(
  addon: AddonId,
  event: HookEvent,
  handler: HookHandler,
): EventSubscription {
  return { event, handler, addon };
}