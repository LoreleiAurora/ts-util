import { describe, expect, it } from 'vitest';
import { unique } from './unique.js';

describe('unique', () => {
  it('should remove duplicates while preserving insertion order', () => {
    expect(unique([3, 1, 3, 2, 1, 2])).toEqual([3, 1, 2]);
  });

  it('should return an empty array for empty input', () => {
    expect(unique([])).toEqual([]);
  });

  it('should return a new array', () => {
    const values = [1, 2, 2];

    expect(unique(values)).not.toBe(values);
  });

  it('should compare objects by reference identity', () => {
    const first = { id: 1 };
    const second = { id: 1 };

    expect(unique([first, first, second])).toEqual([first, second]);
  });

  it('should treat NaN values as equal', () => {
    expect(unique([NaN, NaN])).toEqual([NaN]);
  });

  it('should deduplicate mixed primitive types', () => {
    expect(unique([1, '1', true, 1, '1'])).toEqual([1, '1', true]);
  });
});
