import { invariant } from '../invariant.js';
import type { CancelableFunction } from './types.js';

/**
 * Configures the leading and trailing behaviour of a throttled function.
 */
export type ThrottleOptions = {
  leading?: boolean;
  trailing?: boolean;
};

/**
 * Creates a function that invokes at most once per `waitMs` milliseconds.
 */
export function throttle<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  waitMs: number,
  options: ThrottleOptions = {},
): CancelableFunction<TArgs> {
  invariant(
    Number.isFinite(waitMs) && waitMs >= 0,
    '`waitMs` must be a finite number greater than or equal to zero.',
    RangeError,
  );

  const { leading = true, trailing = true } = options;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let latestArgs: TArgs | undefined;
  let lastInvocation = 0;

  const invoke = (): void => {
    const args = latestArgs;

    latestArgs = undefined;
    lastInvocation = Date.now();

    if (args) {
      callback(...args);
    }
  };

  const onTimerExpired = (): void => {
    timer = undefined;

    if (trailing && latestArgs) {
      invoke();
      return;
    }

    latestArgs = undefined;
  };

  const throttled = (...args: TArgs): void => {
    const now = Date.now();

    if (lastInvocation === 0 && !leading) {
      lastInvocation = now;
    }

    latestArgs = args;

    const remaining = waitMs - (now - lastInvocation);

    if (remaining <= 0 || remaining > waitMs) {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }

      invoke();
      return;
    }

    if (!timer && trailing) {
      timer = setTimeout(onTimerExpired, remaining);
    }
  };

  throttled.cancel = (): void => {
    if (timer) {
      clearTimeout(timer);
    }

    timer = undefined;
    latestArgs = undefined;
  };

  throttled.flush = (): void => {
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    timer = undefined;

    if (latestArgs) {
      invoke();
    }
  };

  return throttled;
}
