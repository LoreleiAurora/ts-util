import { describe, expect, it } from 'vitest';
import { chunk } from './chunk.js';

describe('chunk', () => {
  it('should split an array into equally sized chunks', () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('should keep remaining items in a final smaller chunk', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should return an empty array for empty input', () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it('should return one chunk when size exceeds input length', () => {
    expect(chunk(['a', 'b'], 10)).toEqual([['a', 'b']]);
  });

  it('should not mutate the input array', () => {
    const values = [1, 2, 3];

    chunk(values, 2);

    expect(values).toEqual([1, 2, 3]);
  });

  it('should not share chunk references with the input array', () => {
    const values = [1, 2, 3];
    const [firstChunk] = chunk(values, 2);

    expect(firstChunk).not.toBe(values);
  });

  it.each([0, -1, 1.5, NaN, Infinity])(
    'should throw a RangeError for invalid size %s',
    (size) => {
      expect(() => chunk([1, 2], size)).toThrow(RangeError);
      expect(() => chunk([1, 2], size)).toThrow(
        '`size` must be an integer greater than zero.',
      );
    },
  );
});
