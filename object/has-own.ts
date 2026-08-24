/**
 * Determines whether an object directly owns a property.
 */
export function hasOwn<T extends object, K extends PropertyKey>(
  value: T,
  key: K,
): key is K & keyof T {
  // biome-ignore lint/suspicious/noPrototypeBuiltins: intentional in this utility
  return Object.prototype.hasOwnProperty.call(value, key);
}
