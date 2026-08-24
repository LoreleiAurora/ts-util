import { invariant } from '../invariant.js';
import { abortReason } from './abort.js';
import { sleep } from './sleep.js';

/**
 * Describes the current invocation of a retried operation.
 */
export type RetryContext = {
  attempt: number;
  retries: number;
  signal?: AbortSignal;
};

/**
 * Specifies a fixed or dynamically calculated delay between retries.
 */
export type RetryDelay =
  | number
  | ((context: RetryContext) => number | Promise<number>);

/**
 * Configures retry behaviour.
 */
export type RetryOptions = {
  maxAttempts?: number;
  signal?: AbortSignal;
  delay?: RetryDelay;
  shouldRetry?: (
    error: unknown,
    context: RetryContext,
  ) => boolean | Promise<boolean>;
  onRetry?: (error: unknown, context: RetryContext) => void | Promise<void>;
};

/**
 * Resolves and validates a retry delay.
 */
async function resolveDelay(
  delay: RetryDelay | undefined,
  context: RetryContext,
): Promise<number> {
  const value =
    typeof delay === 'function' ? await delay(context) : (delay ?? 0);

  invariant(
    Number.isFinite(value) && value >= 0,
    '`delay` must resolve to a finite number greater than or equal to zero.',
    RangeError,
  );

  return value;
}

/**
 * Repeatedly invokes an operation until it succeeds, is cancelled, or reaches
 * its maximum number of attempts.
 */
export async function retry<T>(
  operation: (context: RetryContext) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, signal, delay, shouldRetry, onRetry } = options;

  invariant(
    Number.isInteger(maxAttempts) && maxAttempts >= 1,
    '`maxAttempts` must be an integer greater than or equal to one.',
    RangeError,
  );

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw abortReason(signal);
    }

    const context: RetryContext = {
      attempt,
      retries: attempt - 1,
      signal,
    };

    try {
      return await operation(context);
    } catch (error) {
      lastError = error;

      if (signal?.aborted) {
        throw abortReason(signal);
      }

      if (attempt === maxAttempts) {
        break;
      }

      if (shouldRetry && !(await shouldRetry(error, context))) {
        throw error;
      }

      await onRetry?.(error, context);

      const milliseconds = await resolveDelay(delay, context);
      await sleep(milliseconds, signal);
    }
  }

  throw lastError;
}
