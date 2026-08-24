import { invariant } from '../invariant.js';
import { abortReason } from './abort.js';

/**
 * Resolves after a delay, or rejects if the optional signal is aborted.
 */
export function sleep(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  invariant(
    Number.isFinite(milliseconds) && milliseconds >= 0,
    '`milliseconds` must be a finite number greater than or equal to zero.',
    RangeError,
  );

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal));
      return;
    }

    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortReason(signal));
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
