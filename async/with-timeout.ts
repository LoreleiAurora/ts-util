import { invariant } from '../invariant.js';
import { abortReason } from './abort.js';

/**
 * Represents an operation that exceeded its configured timeout.
 */
export class TimeoutError extends Error {
  public readonly timeoutMs: number;

  /**
   * Creates a timeout error for an operation exceeding `timeoutMs`.
   */
  public constructor(timeoutMs: number) {
    super(`The operation timed out after ${timeoutMs}ms.`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Configures a timeout-wrapped operation.
 */
export type WithTimeoutOptions = {
  signal?: AbortSignal;
};

/**
 * Invokes an abort-aware operation and aborts its signal after a timeout.
 *
 * The operation itself must honour the supplied signal for cancellation to
 * interrupt its underlying work.
 */
export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  options: WithTimeoutOptions = {},
): Promise<T> {
  invariant(
    Number.isFinite(timeoutMs) && timeoutMs >= 0,
    '`timeoutMs` must be a finite number greater than or equal to zero.',
    RangeError,
  );

  const { signal } = options;

  if (signal?.aborted) {
    throw abortReason(signal);
  }

  const controller = new AbortController();

  const onAbort = (): void => {
    controller.abort(abortReason(signal));
  };

  signal?.addEventListener('abort', onAbort, { once: true });

  const timer = setTimeout(() => {
    controller.abort(new TimeoutError(timeoutMs));
  }, timeoutMs);

  try {
    return await operation(controller.signal);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
