import { describe, expect, it } from 'vitest';
import { hasOwn } from './has-own.js';

describe('hasOwn', () => {
  it('should return true for an own property', () => {
    expect(hasOwn({ name: 'Ada' }, 'name')).toBe(true);
  });

  it('should return false for an inherited property', () => {
    const value = Object.create({ inherited: true }) as {
      inherited?: boolean;
    };

    expect(hasOwn(value, 'inherited')).toBe(false);
  });

  it('should return false for a missing property', () => {
    expect(hasOwn({ name: 'Ada' }, 'missing')).toBe(false);
  });

  it('should support symbol properties', () => {
    const key = Symbol('key');
    const value = {
      [key]: 'value',
    };

    expect(hasOwn(value, key)).toBe(true);
  });

  it('should work with null-prototype objects', () => {
    const value = Object.create(null) as Record<string, string>;
    value.name = 'Ada';

    expect(hasOwn(value, 'name')).toBe(true);
  });

  it('should narrow the key to a known property', () => {
    const value = {
      id: 1,
      name: 'Ada',
    };

    const key = 'name' as 'id' | 'name' | 'missing';

    if (hasOwn(value, key)) {
      expect(value[key]).toBe('Ada');
    }
  });
});
