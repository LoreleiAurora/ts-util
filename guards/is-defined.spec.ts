import { describe, expect, it } from 'vitest';
import { isDefined } from './is-defined.js';

describe('isDefined', () => {
  it.each([
    ['string', 'value'],
    ['number', 42],
    ['zero', 0],
    ['false', false],
    ['empty string', ''],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['BigInt', 0n],
    ['object', {}],
    ['array', []],
  ])('should return true for defined %s', (_label, value) => {
    expect(isDefined(value)).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('should return false for %s', (_label, value) => {
    expect(isDefined(value)).toBe(false);
  });

  it('should narrow arrays filtered with isDefined', () => {
    const values = ['first', null, 'second', undefined].filter(isDefined);

    expect(values).toEqual(['first', 'second']);
  });
});
