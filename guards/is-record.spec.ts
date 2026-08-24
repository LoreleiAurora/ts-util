import { describe, expect, it } from 'vitest';
import { isRecord } from './is-record.js';

describe('isRecord', () => {
  it.each([
    ['plain object', {}],
    ['object with properties', { name: 'Ada' }],
    ['null-prototype object', Object.create(null)],
    ['array-like object', { length: 0 }],
  ])('should return true for a %s', (_label, value) => {
    expect(isRecord(value)).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['array', []],
    ['string', 'value'],
    ['number', 1],
    ['boolean', true],
    ['function', () => {}],
    ['symbol', Symbol('value')],
    ['Date instance', new Date()],
    ['RegExp instance', /pattern/],
    ['Map instance', new Map()],
    ['Set instance', new Set()],
    ['class instance', new (class {})()],
    ['object with custom prototype', Object.create({ custom: true })],
    ['String object wrapper', new String('value')],
    ['Number object wrapper', new Number(1)],
    ['Boolean object wrapper', new Boolean(true)],
  ])('should return false for %s', (_label, value) => {
    expect(isRecord(value)).toBe(false);
  });

  it('should narrow unknown values for safe property access', () => {
    const value: unknown = { name: 'Ada' };

    if (isRecord(value)) {
      expect(value.name).toBe('Ada');
    }
  });
});
