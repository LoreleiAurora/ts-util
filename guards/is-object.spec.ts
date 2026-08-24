import { describe, expect, it } from 'vitest';
import { isObject } from './is-object.js';

describe('isObject', () => {
  it.each([
    ['plain object', {}],
    ['array', []],
    ['Date instance', new Date()],
    ['RegExp instance', /pattern/],
    ['Map instance', new Map()],
    ['Set instance', new Set()],
    ['class instance', new (class {})()],
  ])('should return true for %s', (_label, value) => {
    expect(isObject(value)).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['string', 'value'],
    ['number', 1],
    ['boolean', true],
    ['function', () => {}],
    ['symbol', Symbol('value')],
  ])('should return false for %s', (_label, value) => {
    expect(isObject(value)).toBe(false);
  });
});
