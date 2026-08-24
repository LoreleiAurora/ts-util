import { afterEach, describe, expect, it, vi } from 'vitest';
import { retry } from './retry.js';

describe('retry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the operation result on the first successful attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    await expect(retry(operation)).resolves.toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith({
      attempt: 1,
      retries: 0,
      signal: undefined,
    });
  });

  it('should retry failed operations until one succeeds', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');

    await expect(
      retry(operation, {
        maxAttempts: 3,
        delay: 0,
      }),
    ).resolves.toBe('success');

    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should throw the final operation error after all attempts fail', async () => {
    const error = new Error('Failed');
    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      retry(operation, {
        maxAttempts: 2,
        delay: 0,
      }),
    ).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should pass the same signal to every operation context', async () => {
    const controller = new AbortController();
    const operation = vi.fn(async (context: { signal?: AbortSignal }) => {
      expect(context.signal).toBe(controller.signal);
      return 'success';
    });

    await retry(operation, {
      signal: controller.signal,
    });

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry with the failed attempt context', async () => {
    const error = new Error('Temporary failure');
    const onRetry = vi.fn();
    const operation = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('ok');

    await retry(operation, {
      maxAttempts: 2,
      delay: 0,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledWith(error, {
      attempt: 1,
      retries: 0,
      signal: undefined,
    });
  });

  it('should not call onRetry after the final failed attempt', async () => {
    const error = new Error('Failed');
    const onRetry = vi.fn();

    await expect(
      retry(
        async () => {
          throw error;
        },
        {
          maxAttempts: 1,
          onRetry,
        },
      ),
    ).rejects.toBe(error);

    expect(onRetry).not.toHaveBeenCalled();
  });

  it('should not resolve delay after the final failed attempt', async () => {
    const delay = vi.fn(() => 0);

    await expect(
      retry(
        async () => {
          throw new Error('Failed');
        },
        {
          maxAttempts: 1,
          delay,
        },
      ),
    ).rejects.toThrow('Failed');

    expect(delay).not.toHaveBeenCalled();
  });

  it('should use a dynamic delay with the retry context', async () => {
    const delay = vi.fn(() => 0);
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValue('ok');

    await retry(operation, {
      maxAttempts: 2,
      delay,
    });

    expect(delay).toHaveBeenCalledWith({
      attempt: 1,
      retries: 0,
      signal: undefined,
    });
  });

  it('should stop retrying when shouldRetry returns false', async () => {
    const error = new Error('Not retryable');
    const operation = vi.fn().mockRejectedValue(error);
    const shouldRetry = vi.fn().mockResolvedValue(false);

    await expect(
      retry(operation, {
        maxAttempts: 3,
        delay: 0,
        shouldRetry,
      }),
    ).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it('should await an async shouldRetry callback', async () => {
    const shouldRetry = vi.fn().mockResolvedValue(true);
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('First'))
      .mockResolvedValue('ok');

    await retry(operation, {
      maxAttempts: 2,
      delay: 0,
      shouldRetry,
    });

    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it('should propagate an error thrown by shouldRetry', async () => {
    const shouldRetryError = new Error('shouldRetry crashed');

    await expect(
      retry(
        async () => {
          throw new Error('Operation failed');
        },
        {
          maxAttempts: 2,
          delay: 0,
          shouldRetry: () => {
            throw shouldRetryError;
          },
        },
      ),
    ).rejects.toBe(shouldRetryError);
  });

  it('should propagate an error thrown by onRetry', async () => {
    const onRetryError = new Error('onRetry crashed');

    await expect(
      retry(
        async () => {
          throw new Error('Operation failed');
        },
        {
          maxAttempts: 2,
          delay: 0,
          onRetry: () => {
            throw onRetryError;
          },
        },
      ),
    ).rejects.toBe(onRetryError);
  });

  it('should await an async onRetry callback', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('First'))
      .mockResolvedValue('ok');

    await retry(operation, {
      maxAttempts: 2,
      delay: 0,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should reject with the abort reason before invoking the operation', async () => {
    const controller = new AbortController();
    const reason = new Error('Cancelled');
    const operation = vi.fn();

    controller.abort(reason);

    await expect(
      retry(operation, {
        signal: controller.signal,
      }),
    ).rejects.toBe(reason);

    expect(operation).not.toHaveBeenCalled();
  });

  it('should reject when aborted after an operation failure', async () => {
    const controller = new AbortController();
    const reason = new Error('Cancelled');
    const operation = vi.fn(async () => {
      controller.abort(reason);
      throw new Error('Operation failed');
    });

    await expect(
      retry(operation, {
        maxAttempts: 2,
        delay: 0,
        signal: controller.signal,
      }),
    ).rejects.toBe(reason);
  });

  it('should stop retrying when aborted during a retry delay', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();
    const reason = new Error('Cancelled');
    const operation = vi.fn(async () => {
      throw new Error('Temporary failure');
    });

    const promise = retry(operation, {
      maxAttempts: 3,
      delay: 1_000,
      signal: controller.signal,
    });

    await vi.advanceTimersByTimeAsync(0);

    controller.abort(reason);

    await expect(promise).rejects.toBe(reason);
    expect(operation).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should reject with an AbortError when aborted without a reason', async () => {
    const controller = new AbortController();

    controller.abort();

    await expect(
      retry(vi.fn(), {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({
      name: 'AbortError',
      message: 'The operation was aborted.',
    });
  });

  it('should retry synchronous throws from the operation', async () => {
    const operation = vi.fn(() => {
      throw new Error('Synchronous throw');
    });

    await expect(
      retry(operation as never, {
        maxAttempts: 3,
        delay: 0,
      }),
    ).rejects.toThrow('Synchronous throw');
  });

  it.each([0, -1, 1.5, NaN])(
    'should throw a RangeError for invalid maxAttempts %s',
    async (maxAttempts) => {
      await expect(
        retry(async () => 'success', {
          maxAttempts,
        }),
      ).rejects.toThrow(RangeError);

      await expect(
        retry(async () => 'success', {
          maxAttempts,
        }),
      ).rejects.toThrow(
        '`maxAttempts` must be an integer greater than or equal to one.',
      );
    },
  );

  it('should reject when a delay callback returns an invalid delay', async () => {
    await expect(
      retry(
        async () => {
          throw new Error('Failed');
        },
        {
          maxAttempts: 2,
          delay: -1,
        },
      ),
    ).rejects.toThrow(
      '`delay` must resolve to a finite number greater than or equal to zero.',
    );
  });
});
