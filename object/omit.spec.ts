import { describe, expect, it } from 'vitest';
import { omit } from './omit.js';

describe('omit', () => {
  it('should return all own enumerable properties except omitted keys', () => {
    const value = {
      active: true,
      id: 1,
      name: 'Ada',
    };

    expect(omit(value, ['name'])).toEqual({
      id: 1,
      active: true,
    });
  });

  it('should return all properties when no keys are omitted', () => {
    expect(
      omit(
        {
          id: 1,
          name: 'Ada',
        },
        [],
      ),
    ).toEqual({
      id: 1,
      name: 'Ada',
    });
  });

  it('should ignore omitted keys absent from the object', () => {
    expect(
      omit(
        {
          id: 1,
        },
        ['missing'] as never[],
      ),
    ).toEqual({
      id: 1,
    });
  });

  it('should ignore non-enumerable properties', () => {
    const value = {
      visible: 'visible',
    } as {
      hidden: string;
      visible: string;
    };

    Object.defineProperty(value, 'hidden', {
      enumerable: false,
      value: 'hidden',
    });

    expect(omit(value, ['visible'])).toEqual({});
  });

  it('should omit symbol keys', () => {
    const key = Symbol('secret');
    const value = {
      [key]: 'hidden',
      visible: true,
    };

    const result = omit(value, [key]);

    expect(result).toEqual({
      visible: true,
    });
    expect(Object.hasOwn(result, key)).toBe(false);
  });

  it('should not mutate the input object', () => {
    const value = {
      id: 1,
      name: 'Ada',
    };

    omit(value, ['name']);

    expect(value).toEqual({
      id: 1,
      name: 'Ada',
    });
  });
});
