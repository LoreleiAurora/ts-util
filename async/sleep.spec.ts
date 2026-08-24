import { afterEach, describe, expect, it, vi } from 'vitest';
import { sleep } from './sleep.js';

describe('sleep', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should resolve after the requested delay', async () => {
    vi.useFakeTimers();

    const promise = sleep(100);

    await vi.advanceTimersByTimeAsync(99);
    await expect(
      Promise.race([promise, Promise.resolve('pending')]),
    ).resolves.toBe('pending');

    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toBeUndefined();
  });

  it('should resolve immediately for a zero delay', async () => {
    vi.useFakeTimers();

    const promise = sleep(0);

    await vi.advanceTimersByTimeAsync(0);

    await expect(promise).resolves.toBeUndefined();
  });

  it('should reject with the abort reason when aborted while waiting', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();
    const reason = new Error('Cancelled');
    const promise = sleep(100, controller.signal);

    controller.abort(reason);

    await expect(promise).rejects.toBe(reason);
  });

  it('should reject immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    const reason = new Error('Already cancelled');

    controller.abort(reason);

    await expect(sleep(100, controller.signal)).rejects.toBe(reason);
  });

  it('should reject with an AbortError when aborted without a reason', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();
    const promise = sleep(100, controller.signal);

    controller.abort();

    await expect(promise).rejects.toMatchObject({
      name: 'AbortError',
      message: 'The operation was aborted.',
    });
  });

  it('should not resolve after rejecting due to abort', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();
    const onResolve = vi.fn();
    const promise = sleep(100, controller.signal);

    promise.then(onResolve, () => {});

    controller.abort();

    await vi.advanceTimersByTimeAsync(200);

    expect(onResolve).not.toHaveBeenCalled();
  });

  it('should remove its abort listener after resolving', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();
    const removeEventListenerSpy = vi.spyOn(
      controller.signal,
      'removeEventListener',
    );

    const promise = sleep(0, controller.signal);

    await vi.advanceTimersByTimeAsync(0);
    await promise;

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'abort',
      expect.any(Function),
    );
  });

  it('should not leave a pending timer after abort', async () => {
    vi.useFakeTimers();

    const controller = new AbortController();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const promise = sleep(100, controller.signal);

    controller.abort();

    await expect(promise).rejects.toThrow();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it.each([-1, NaN, Infinity, -Infinity])(
    'should throw a RangeError for invalid delay %s',
    (milliseconds) => {
      expect(() => sleep(milliseconds)).toThrow(RangeError);
      expect(() => sleep(milliseconds)).toThrow(
        '`milliseconds` must be a finite number greater than or equal to zero.',
      );
    },
  );
});
