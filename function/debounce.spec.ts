import { afterEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce.js';

describe('debounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should invoke the callback after the configured delay', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('value');

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('value');
  });

  it('should only invoke the callback once with the latest arguments for repeated calls', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('first');
    vi.advanceTimersByTime(50);
    debounced('second');
    vi.advanceTimersByTime(50);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
  });

  it('should cancel a pending callback invocation', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should safely call cancel twice', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced();
    debounced.cancel();
    debounced.cancel();

    vi.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should immediately invoke a pending callback when flushed', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('value');
    debounced.flush();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('value');

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should do nothing when flushed without a pending invocation', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced.flush();

    expect(callback).not.toHaveBeenCalled();
  });

  it('should only invoke the callback once when flushed twice', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('value');
    debounced.flush();
    debounced.flush();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should schedule normally after a cancel', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    const debounced = debounce(callback, 100);

    debounced('first');
    debounced.cancel();
    debounced('second');

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');
  });

  it.each([-1, NaN, Infinity])(
    'should throw a RangeError for invalid delay %s',
    (delayMs) => {
      expect(() => debounce(() => {}, delayMs)).toThrow(RangeError);
      expect(() => debounce(() => {}, delayMs)).toThrow(
        '`delayMs` must be a finite number greater than or equal to zero.',
      );
    },
  );
});
