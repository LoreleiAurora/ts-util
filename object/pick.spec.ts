import { describe, expect, it } from 'vitest';
import { pick } from './pick.js';

describe('pick', () => {
  it('should return only the selected own enumerable properties', () => {
    const value = {
      active: true,
      id: 1,
      name: 'Ada',
    };

    expect(pick(value, ['id', 'active'])).toEqual({
      id: 1,
      active: true,
    });
  });

  it('should return an empty object when selecting no keys', () => {
    expect(
      pick(
        {
          id: 1,
        },
        [],
      ),
    ).toEqual({});
  });

  it('should ignore inherited properties', () => {
    const value = Object.create({ inherited: 'ignored' }) as {
      inherited: string;
      own: string;
    };

    value.own = 'included';

    expect(pick(value, ['own', 'inherited'])).toEqual({
      own: 'included',
    });
  });

  it('should ignore non-enumerable properties', () => {
    const value = {} as {
      hidden: string;
      visible: string;
    };

    Object.defineProperty(value, 'visible', {
      enumerable: true,
      value: 'visible',
    });

    Object.defineProperty(value, 'hidden', {
      enumerable: false,
      value: 'hidden',
    });

    expect(pick(value, ['visible', 'hidden'])).toEqual({
      visible: 'visible',
    });
  });

  it('should support symbol keys', () => {
    const key = Symbol('key');
    const value = {
      [key]: 'value',
      name: 'Ada',
    };

    expect(pick(value, [key])).toEqual({
      [key]: 'value',
    });
  });

  it('should not mutate the input object', () => {
    const value = {
      id: 1,
      name: 'Ada',
    };

    pick(value, ['id']);

    expect(value).toEqual({
      id: 1,
      name: 'Ada',
    });
  });
});
