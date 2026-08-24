import { afterEach, describe, expect, it, vi } from 'vitest';
import { throttle } from './throttle.js';

describe('throttle', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('leading and trailing combinations', () => {
    it('should invoke immediately and then invoke the latest trailing call', () => {
      vi.useFakeTimers();

      const callback = vi.fn();
      const throttled = throttle(callback, 100, {
        leading: true,
        trailing: true,
      });

      throttled('first');
      vi.advanceTimersByTime(25);
      throttled('second');
      vi.advanceTimersByTime(25);
      throttled('third');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith('first');

      vi.advanceTimersByTime(50);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('third');
    });

    it('should invoke immediately only when trailing is false', () => {
      vi.useFakeTimers();

      const callback = vi.fn();
      const throttled = throttle(callback, 100, {
        leading: true,
        trailing: false,
      });

      throttled('first');
      throttled('second');
      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });

    it('should delay the first invocation to a trailing call when leading is false', () => {
      vi.useFakeTimers();

      const callback = vi.fn();
      const throttled = throttle(callback, 100, {
        leading: false,
        trailing: true,
      });

      throttled('value');

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('value');
    });

    it('should never invoke when both leading and trailing are false', () => {
      vi.useFakeTimers();

      const callback = vi.fn();
      const throttled = throttle(callback, 100, {
        leading: false,
        trailing: false,
      });

      throttled('value');
      vi.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  it('should cancel a pending trailing invocation', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const throttled = throttle(callback, 100);

    throttled('first');
    throttled('second');
    throttled.cancel();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');
  });

  it('should immediately invoke a pending trailing invocation when flushed', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const throttled = throttle(callback, 100);

    throttled('first');
    throttled('second');
    throttled.flush();

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('second');

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should be a no-op when flushed without a pending trailing invocation', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const throttled = throttle(callback, 100);

    throttled('first');

    vi.advanceTimersByTime(100);

    throttled.flush();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should start a fresh throttle period after cancel', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const throttled = throttle(callback, 100);

    throttled('first');
    throttled('second');
    throttled.cancel();

    throttled('third');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('third');
  });

  it('should pass the most recent arguments to the trailing call', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const throttled = throttle(callback, 100, {
      leading: false,
      trailing: true,
    });

    throttled('first');
    throttled('second');
    throttled('third');

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('third');
  });

  it.each([-1, NaN, Infinity])(
    'should throw a RangeError for invalid wait time %s',
    (waitMs) => {
      expect(() => throttle(() => {}, waitMs)).toThrow(RangeError);
      expect(() => throttle(() => {}, waitMs)).toThrow(
        '`waitMs` must be a finite number greater than or equal to zero.',
      );
    },
  );
});
