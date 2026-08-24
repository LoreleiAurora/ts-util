import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeoutError, withTimeout } from './with-timeout.js';

describe('withTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the operation result when it completes before the timeout', async () => {
    await expect(withTimeout(async () => 'success', 100)).resolves.toBe(
      'success',
    );
  });

  it('should pass a non-aborted signal to the operation', async () => {
    let receivedSignal: AbortSignal | undefined;

    await withTimeout(async (signal) => {
      receivedSignal = signal;
      return 'success';
    }, 100);

    expect(receivedSignal?.aborted).toBe(false);
  });

  it('should abort the operation with a TimeoutError after the timeout', async () => {
    vi.useFakeTimers();

    const operation = vi.fn(
      (signal: AbortSignal) =>
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => {
              reject(signal.reason);
            },
            { once: true },
          );
        }),
    );

    const promise = withTimeout(operation, 100);
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(100);

    await expect(promise).rejects.toBeInstanceOf(TimeoutError);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should expose the configured timeout duration on TimeoutError', async () => {
    vi.useFakeTimers();

    const promise = withTimeout(
      (signal) =>
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        }),
      250,
    );
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(250);

    await expect(promise).rejects.toMatchObject({
      name: 'TimeoutError',
      message: 'The operation timed out after 250ms.',
      timeoutMs: 250,
    });
  });

  it('should preserve an operation error before the timeout', async () => {
    const error = new Error('Request failed');

    await expect(
      withTimeout(async () => {
        throw error;
      }, 1_000),
    ).rejects.toBe(error);
  });

  it('should propagate outer signal cancellation to the operation signal', async () => {
    const controller = new AbortController();
    const reason = new Error('Cancelled');

    const promise = withTimeout(
      (signal) =>
        new Promise<never>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        }),
      1_000,
      {
        signal: controller.signal,
      },
    );

    controller.abort(reason);

    await expect(promise).rejects.toBe(reason);
  });

  it('should not invoke the operation when the outer signal is already aborted', async () => {
    const controller = new AbortController();
    const reason = new Error('Already cancelled');
    const operation = vi.fn();

    controller.abort(reason);

    await expect(
      withTimeout(operation, 100, {
        signal: controller.signal,
      }),
    ).rejects.toBe(reason);

    expect(operation).not.toHaveBeenCalled();
  });

  it('should clear its timeout after a successful operation', async () => {
    vi.useFakeTimers();

    let operationSignal: AbortSignal | undefined;

    await withTimeout(async (signal) => {
      operationSignal = signal;
      return 'success';
    }, 100);

    await vi.advanceTimersByTimeAsync(100);

    expect(operationSignal?.aborted).toBe(false);
  });

  it('should clear its timeout after the operation rejects', async () => {
    vi.useFakeTimers();

    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    await expect(
      withTimeout(async () => {
        throw new Error('Failed');
      }, 1_000),
    ).rejects.toThrow('Failed');

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it.each([-1, NaN, Infinity])(
    'should throw a RangeError for invalid timeout %s',
    async (timeoutMs) => {
      await expect(
        withTimeout(async () => 'success', timeoutMs),
      ).rejects.toThrow(RangeError);

      await expect(
        withTimeout(async () => 'success', timeoutMs),
      ).rejects.toThrow(
        '`timeoutMs` must be a finite number greater than or equal to zero.',
      );
    },
  );
});
