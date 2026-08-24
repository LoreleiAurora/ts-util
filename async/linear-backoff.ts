import { invariant } from '../invariant.js';
import type { RetryContext } from './retry.js';

/**
 * Configures a linear retry backoff strategy.
 */
export type LinearBackoffOptions = {
  initialDelayMs: number;
  incrementMs: number;
  maxDelayMs?: number;
  jitter?: 'full' | 'none';
};

/**
 * Creates a delay function that increases by a fixed amount after each retry.
 */
export function linearBackoff(
  options: LinearBackoffOptions,
): (context: RetryContext) => number {
  const {
    initialDelayMs,
    incrementMs,
    maxDelayMs = Number.POSITIVE_INFINITY,
    jitter = 'none',
  } = options;

  invariant(
    Number.isFinite(initialDelayMs) && initialDelayMs >= 0,
    '`initialDelayMs` must be a finite number greater than or equal to zero.',
    RangeError,
  );

  invariant(
    Number.isFinite(incrementMs) && incrementMs >= 0,
    '`incrementMs` must be a finite number greater than or equal to zero.',
    RangeError,
  );

  invariant(
    (Number.isFinite(maxDelayMs) || maxDelayMs === Number.POSITIVE_INFINITY) &&
      maxDelayMs >= 0,
    '`maxDelayMs` must be a non-negative finite number or Infinity.',
    RangeError,
  );

  invariant(
    jitter === 'none' || jitter === 'full',
    '`jitter` must be either "none" or "full".',
    TypeError,
  );

  return ({ retries }) => {
    const delay = Math.min(initialDelayMs + incrementMs * retries, maxDelayMs);

    return jitter === 'full' ? Math.floor(Math.random() * delay) : delay;
  };
}
