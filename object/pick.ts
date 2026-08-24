import { hasOwn } from './has-own.js';

/**
 * Returns a new object containing the selected own enumerable properties.
 */
export function pick<T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (!hasOwn(value, key)) {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (descriptor?.enumerable) {
      Object.defineProperty(result, key, descriptor);
    }
  }

  return result;
}
