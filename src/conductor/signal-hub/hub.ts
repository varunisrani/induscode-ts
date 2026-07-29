import type { SessionSignal, SignalHandler } from "../contract.js";

export interface SignalHubOptions {
  readonly onHandlerError?: (error: unknown, signal: SessionSignal) => void;
}

export class SignalHub {
  private readonly handlers = new Set<SignalHandler>();
  private readonly onHandlerError?: SignalHubOptions["onHandlerError"];

  constructor(options: SignalHubOptions = {}) {
    this.onHandlerError = options.onHandlerError;
  }

  subscribe(handler: SignalHandler): () => void {
    this.handlers.add(handler);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.handlers.delete(handler);
    };
  }

  emit(signal: SessionSignal): void {
    for (const handler of [...this.handlers]) {
      try {
        handler(signal);
      } catch (error) {
        this.report(error, signal);
      }
    }
  }

  get size(): number { return this.handlers.size; }
  clear(): void { this.handlers.clear(); }

  private report(error: unknown, signal: SessionSignal): void {
    if (!this.onHandlerError) return;
    try {
      this.onHandlerError(error, signal);
    } catch {
      // The error sink is isolated like ordinary subscribers.
    }
  }
}
