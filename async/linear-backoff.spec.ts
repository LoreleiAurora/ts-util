import { describe, expect, it, vi } from 'vitest';
import { linearBackoff } from './linear-backoff.js';

describe('linearBackoff', () => {
  it('should increase the delay by the configured increment per retry', () => {
    const delay = linearBackoff({
      initialDelayMs: 100,
      incrementMs: 50,
    });

    expect(delay({ attempt: 1, retries: 0 })).toBe(100);
    expect(delay({ attempt: 2, retries: 1 })).toBe(150);
    expect(delay({ attempt: 3, retries: 2 })).toBe(200);
  });

  it('should cap delays at maxDelayMs', () => {
    const delay = linearBackoff({
      initialDelayMs: 100,
      incrementMs: 100,
      maxDelayMs: 250,
    });

    expect(delay({ attempt: 1, retries: 0 })).toBe(100);
    expect(delay({ attempt: 2, retries: 1 })).toBe(200);
    expect(delay({ attempt: 3, retries: 2 })).toBe(250);
    expect(delay({ attempt: 10, retries: 9 })).toBe(250);
  });

  it('should cap even the initial delay when maxDelayMs is lower', () => {
    const delay = linearBackoff({
      initialDelayMs: 1_000,
      incrementMs: 100,
      maxDelayMs: 500,
    });

    expect(delay({ attempt: 1, retries: 0 })).toBe(500);
  });

  it('should accept Infinity for maxDelayMs', () => {
    const delay = linearBackoff({
      initialDelayMs: 100,
      incrementMs: 100,
      maxDelayMs: Number.POSITIVE_INFINITY,
    });

    expect(delay({ attempt: 10, retries: 9 })).toBe(1_000);
  });

  it('should support full jitter producing values within the capped delay', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    const delay = linearBackoff({
      initialDelayMs: 100,
      incrementMs: 50,
      jitter: 'full',
    });

    expect(delay({ attempt: 1, retries: 0 })).toBe(0);

    random.mockRestore();
  });

  it('should never exceed the capped delay with full jitter', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.9999);

    const delay = linearBackoff({
      initialDelayMs: 100,
      incrementMs: 50,
      jitter: 'full',
    });

    const capped = delay({ attempt: 1, retries: 0 });

    expect(capped).toBeLessThanOrEqual(100);

    random.mockRestore();
  });

  it.each([
    [
      {
        initialDelayMs: -1,
        incrementMs: 0,
      },
      '`initialDelayMs` must be a finite number greater than or equal to zero.',
    ],
    [
      {
        initialDelayMs: 0,
        incrementMs: -1,
      },
      '`incrementMs` must be a finite number greater than or equal to zero.',
    ],
    [
      {
        initialDelayMs: 0,
        incrementMs: 0,
        maxDelayMs: -1,
      },
      '`maxDelayMs` must be a non-negative finite number or Infinity.',
    ],
    [
      {
        initialDelayMs: 0,
        incrementMs: 0,
        jitter: 'invalid' as 'none',
      },
      '`jitter` must be either "none" or "full".',
    ],
  ])('should reject invalid options %#', (options, message) => {
    expect(() => linearBackoff(options)).toThrow(message);
  });
});
