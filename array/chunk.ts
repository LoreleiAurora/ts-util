import { invariant } from '../invariant.js';

/**
 * Splits an array into arrays containing at most `size` items each.
 */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  invariant(
    Number.isInteger(size) && size > 0,
    '`size` must be an integer greater than zero.',
    RangeError,
  );

  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}
