import { invariant } from '../invariant.js';
import type { CancelableFunction } from './types.js';

/**
 * Creates a function that delays invocation until calls have stopped for
 * `delayMs` milliseconds.
 */
export function debounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
): CancelableFunction<TArgs> {
  invariant(
    Number.isFinite(delayMs) && delayMs >= 0,
    '`delayMs` must be a finite number greater than or equal to zero.',
    RangeError,
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  let latestArgs: TArgs | undefined;

  const invoke = (): void => {
    const args = latestArgs;

    latestArgs = undefined;
    timer = undefined;

    if (args) {
      callback(...args);
    }
  };

  const debounced = (...args: TArgs): void => {
    latestArgs = args;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(invoke, delayMs);
  };

  debounced.cancel = (): void => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = undefined;
    latestArgs = undefined;
  };

  debounced.flush = (): void => {
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    invoke();
  };

  return debounced;
}
