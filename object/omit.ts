/**
 * Returns a new object excluding the specified own enumerable properties.
 */
export function omit<T extends object, K extends keyof T>(
  value: T,
  keys: readonly K[],
): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys);
  const result = {} as Omit<T, K>;

  for (const key of Reflect.ownKeys(value)) {
    if (excluded.has(key)) {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (descriptor?.enumerable) {
      Object.defineProperty(result, key, descriptor);
    }
  }

  return result;
}
