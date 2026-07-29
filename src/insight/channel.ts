/**
 * Signal channel — the in-memory pipe between the recorder and the sinks.
 */
import type { Signal, SignalChannel, SignalEmit, SignalStream } from "./contract.js";

interface Subscriber {
  buffer: Signal[];
  waiter: ((value: { value: Signal; done: false } | { value: undefined; done: true }) => void) | null;
  done: boolean;
}

export function createChannel(): SignalChannel {
  const subscribers = new Set<Subscriber>();
  let closed = false;

  function deliver(sub: Subscriber, signal: Signal): void {
    if (sub.waiter !== null) {
      const resolve = sub.waiter;
      sub.waiter = null;
      resolve({ value: signal, done: false });
    } else {
      sub.buffer.push(signal);
    }
  }

  const emit: SignalEmit = (signal) => {
    if (closed) return;
    for (const sub of subscribers) {
      deliver(sub, signal);
    }
  };

  function close(): void {
    if (closed) return;
    closed = true;
    for (const sub of subscribers) {
      sub.done = true;
      if (sub.waiter !== null && sub.buffer.length === 0) {
        const resolve = sub.waiter;
        sub.waiter = null;
        resolve({ value: undefined, done: true });
      }
    }
  }

  function stream(): SignalStream {
    const sub: Subscriber = { buffer: [], waiter: null, done: closed };
    subscribers.add(sub);
    const iterator = {
      next(): Promise<{ value: Signal; done: false } | { value: undefined; done: true }> {
        const buffered = sub.buffer.shift();
        if (buffered !== undefined) {
          return Promise.resolve({ value: buffered, done: false });
        }
        if (sub.done) {
          subscribers.delete(sub);
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise((resolve) => {
          sub.waiter = resolve;
        });
      },
      return(): Promise<{ value: undefined; done: true }> {
        subscribers.delete(sub);
        sub.waiter = null;
        sub.buffer.length = 0;
        return Promise.resolve({ value: undefined, done: true });
      },
    };
    return {
      [Symbol.asyncIterator]() {
        return iterator;
      },
    };
  }

  return {
    emit,
    stream,
    get size(): number {
      return subscribers.size;
    },
    get closed(): boolean {
      return closed;
    },
    close,
  };
}