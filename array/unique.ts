/**
 * Returns a new array containing the first occurrence of each unique value.
 */
export function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}
