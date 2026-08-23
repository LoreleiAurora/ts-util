import { describe, expect, it, vi } from 'vitest';
import { InvariantError, invariant } from './invariant.js';

describe('invariant', () => {
  describe('truthy conditions', () => {
    it.each([
      ['boolean true', true],
      ['positive number', 1],
      ['negative number', -1],
      ['non-empty string', 'hello'],
      ['empty object', {}],
      ['empty array', []],
      ['non-zero float', 0.1],
      ['Infinity', Infinity],
      ['object with properties', { key: 'value' }],
      ['array with elements', [1, 2, 3]],
      ['Symbol', Symbol('test')],
      ['function', () => {}],
      ['Date object', new Date()],
      ['BigInt 1n', 1n],
    ])('should not throw for truthy value: %s', (_label, value) => {
      expect(() => invariant(value, 'should not throw')).not.toThrow();
    });

    it('should not evaluate the message function when condition is truthy', () => {
      const spy = vi.fn(() => 'should not be called');

      invariant(true, spy);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not throw when no message is provided and condition is truthy', () => {
      expect(() => invariant(true)).not.toThrow();
    });

    it('should not throw for a truthy object with a falsy property value', () => {
      expect(() => invariant({ count: 0 }, 'should not throw')).not.toThrow();
    });
  });

  describe('falsy conditions', () => {
    it.each([
      ['boolean false', false],
      ['zero', 0],
      ['empty string', ''],
      ['null', null],
      ['undefined', undefined],
      ['NaN', NaN],
      ['BigInt 0n', 0n],
    ])('should throw for falsy value: %s', (_label, value) => {
      expect(() => invariant(value, 'should throw')).toThrow(InvariantError);
    });
  });

  describe('no message provided', () => {
    it('should throw an InvariantError with the default prefix', () => {
      try {
        invariant(false);
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvariantError);
        expect((error as Error).message).toBe('Invariant failed');
      }
    });

    it('should throw an InvariantError for null condition', () => {
      expect(() => invariant(null)).toThrow(InvariantError);
    });

    it('should throw an InvariantError for undefined condition', () => {
      expect(() => invariant(undefined)).toThrow(InvariantError);
    });

    it('should throw an InvariantError for 0', () => {
      expect(() => invariant(0)).toThrow(InvariantError);
    });

    it('should throw an InvariantError for empty string', () => {
      expect(() => invariant('')).toThrow(InvariantError);
    });

    it('should throw an InvariantError for NaN', () => {
      expect(() => invariant(NaN)).toThrow(InvariantError);
    });

    it('should throw an InvariantError for false', () => {
      expect(() => invariant(false)).toThrow(InvariantError);
    });

    it('should throw an InvariantError for BigInt 0n', () => {
      expect(() => invariant(0n)).toThrow(InvariantError);
    });
  });

  describe('string message', () => {
    it('should throw an InvariantError with prefixed message', () => {
      const message = 'Expected value to be a person';

      expect(() => invariant(false, message)).toThrow(
        'Invariant failed: Expected value to be a person',
      );
    });

    it('should throw an InvariantError instance', () => {
      expect(() => invariant(false, 'some message')).toThrow(InvariantError);
    });

    it('should throw with only the prefix when message is an empty string', () => {
      expect(() => invariant(false, '')).toThrow('Invariant failed');
    });

    it('should include the custom message in the error', () => {
      const message = 'Custom error message';

      try {
        invariant(false, message);
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvariantError);
        expect((error as Error).message).toBe(`Invariant failed: ${message}`);
      }
    });

    it('should throw for each falsy condition type with a string message', () => {
      const message = 'failed';

      for (const falsyValue of [false, 0, '', null, undefined, NaN]) {
        expect(() => invariant(falsyValue, message)).toThrow(
          `Invariant failed: ${message}`,
        );
      }
    });
  });

  describe('function returning a string', () => {
    it('should throw an InvariantError with the prefixed message from the function', () => {
      const messageFn = () => 'dynamic message';

      expect(() => invariant(false, messageFn)).toThrow(
        'Invariant failed: dynamic message',
      );
    });

    it('should throw an InvariantError instance', () => {
      expect(() => invariant(false, () => 'message')).toThrow(InvariantError);
    });

    it('should lazily evaluate the function (not called when condition is truthy)', () => {
      const spy = vi.fn(() => 'should not be called');

      invariant(true, spy);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should call the function exactly once when condition is falsy', () => {
      const spy = vi.fn(() => 'called');

      try {
        invariant(false, spy);
      } catch {
        // expected
      }

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should support template literal messages with dynamic content', () => {
      const value: unknown = null;

      expect(() =>
        invariant(
          false,
          () => `Expected a person, got ${JSON.stringify(value)}`,
        ),
      ).toThrow('Invariant failed: Expected a person, got null');
    });

    it('should throw with only the prefix when function returns an empty string', () => {
      expect(() => invariant(false, () => '')).toThrow('Invariant failed');
    });

    it('should throw with only the prefix when function returns undefined', () => {
      expect(() =>
        invariant(false, () => undefined as unknown as string),
      ).toThrow('Invariant failed');
    });

    it('should throw with only the prefix when function returns null', () => {
      expect(() => invariant(false, () => null as unknown as string)).toThrow(
        'Invariant failed',
      );
    });

    it('should throw with only the prefix when function returns 0', () => {
      expect(() => invariant(false, () => 0 as unknown as string)).toThrow(
        'Invariant failed',
      );
    });

    it('should throw with only the prefix when function returns false', () => {
      expect(() => invariant(false, () => false as unknown as string)).toThrow(
        'Invariant failed',
      );
    });
  });

  describe('function that throws', () => {
    it('should propagate an error thrown by the message function itself', () => {
      const factoryError = new Error('factory crashed');
      const crashingFn = () => {
        throw factoryError;
      };

      expect(() => invariant(false, crashingFn)).toThrow(factoryError);
    });

    it('should not catch or wrap an error thrown by the message function', () => {
      const factoryError = new TypeError('factory type error');

      try {
        invariant(false, () => {
          throw factoryError;
        });
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBe(factoryError);
        expect(error).not.toBeInstanceOf(InvariantError);
      }
    });
  });

  describe('errorClass parameter', () => {
    class ValidationError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
      }
    }

    it('should throw an instance of the provided error class', () => {
      expect(() => invariant(false, 'invalid', ValidationError)).toThrow(
        ValidationError,
      );
    });

    it('should pass the message as-is without the "Invariant failed" prefix', () => {
      try {
        invariant(false, 'invalid input', ValidationError);
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as Error).message).toBe('invalid input');
      }
    });

    it('should work with a lazy message function', () => {
      expect(() =>
        invariant(false, () => 'lazy error', ValidationError),
      ).toThrow(ValidationError);

      try {
        invariant(false, () => 'lazy message', ValidationError);
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect((error as Error).message).toBe('lazy message');
      }
    });

    it('should use the prefix as the message when message is omitted', () => {
      try {
        invariant(false, undefined, ValidationError);
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as Error).message).toBe('Invariant failed');
      }
    });

    it('should use the prefix as the message when message is an empty string', () => {
      try {
        invariant(false, '', ValidationError);
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as Error).message).toBe('Invariant failed');
      }
    });

    it('should throw a RangeError when RangeError is provided', () => {
      expect(() => invariant(false, 'out of bounds', RangeError)).toThrow(
        RangeError,
      );
      expect(() => invariant(false, 'out of bounds', RangeError)).toThrow(
        'out of bounds',
      );
    });

    it('should throw InvariantError by default when errorClass is omitted', () => {
      try {
        invariant(false, 'message');
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvariantError);
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should lazily evaluate the message function when errorClass is provided', () => {
      const spy = vi.fn(() => 'should not be called');

      invariant(true, spy, ValidationError);

      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle a function that returns an empty string with errorClass', () => {
      try {
        invariant(false, () => '', ValidationError);
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as Error).message).toBe('Invariant failed');
      }
    });
  });

  describe('type narrowing behavior', () => {
    it('should narrow union types after assertion (runtime check)', () => {
      const value: string | null = 'hello';

      invariant(value, 'expected non-null');

      expect(value.toUpperCase()).toBe('HELLO');
    });

    it('should allow narrowing for optional parameters', () => {
      function process(value?: number): number {
        invariant(value !== undefined, 'value is required');
        return value * 2;
      }

      expect(process(5)).toBe(10);
      expect(() => process(undefined)).toThrow(
        'Invariant failed: value is required',
      );
    });

    it('should support narrowing from unknown', () => {
      function process(value: unknown): string {
        invariant(typeof value === 'string', 'expected a string');
        return value;
      }

      expect(process('test')).toBe('test');
      expect(() => process(42)).toThrow('Invariant failed: expected a string');
    });
  });

  describe('edge cases', () => {
    it('should not throw for a truthy object with value 0', () => {
      expect(() => invariant({ count: 0 }, 'should not throw')).not.toThrow();
    });

    it('should throw for BigInt 0n', () => {
      expect(() => invariant(0n, 'bigInt zero is falsy')).toThrow(
        'Invariant failed: bigInt zero is falsy',
      );
    });

    it('should not throw for BigInt 1n', () => {
      expect(() => invariant(1n, 'should not throw')).not.toThrow();
    });

    it('should not throw for an empty array (truthy in JS)', () => {
      expect(() => invariant([], 'should not throw')).not.toThrow();
    });

    it('should not throw for an empty object (truthy in JS)', () => {
      expect(() => invariant({}, 'should not throw')).not.toThrow();
    });

    it('should handle a function that returns a string with special characters', () => {
      expect(() =>
        invariant(false, () => 'error with "quotes" and \\backslash'),
      ).toThrow('Invariant failed: error with "quotes" and \\backslash');
    });

    it('should handle a very long message string', () => {
      const longMessage = 'x'.repeat(10_000);

      expect(() => invariant(false, longMessage)).toThrow(
        `Invariant failed: ${longMessage}`,
      );
    });

    it('should throw InvariantError by default (not a plain Error)', () => {
      try {
        invariant(false, 'message');
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvariantError);
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should have a stack trace that references the invariant call site', () => {
      try {
        invariant(false, 'trace check');
        expect.unreachable('Expected invariant to throw');
      } catch (error) {
        const stack = (error as Error).stack ?? '';

        expect(stack).toContain('invariant');
      }
    });
  });

  describe('multiple sequential invariant calls', () => {
    it('should handle multiple sequential invariant calls correctly', () => {
      expect(() => {
        invariant(true, 'first');
        invariant(true, 'second');
        invariant(false, 'third');
      }).toThrow('Invariant failed: third');
    });

    it('should stop at the first failing invariant', () => {
      const spy = vi.fn(() => 'should not be reached');

      expect(() => {
        invariant(false, 'first failure');
        invariant(true, spy);
      }).toThrow('Invariant failed: first failure');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should allow multiple invariants to pass sequentially without throwing', () => {
      expect(() => {
        invariant(true, 'first');
        invariant(1, 'second');
        invariant('non-empty', 'third');
        invariant({}, 'fourth');
      }).not.toThrow();
    });
  });
});
