import { isObject } from './is-object.js';

/**
 * Determines whether a value is a plain object with a standard or null
 * prototype, excluding arrays, class instances, and built-in objects such as
 * `Date`, `Map`, and `RegExp`.
 */
export function isRecord(
  value: unknown,
): value is Record<PropertyKey, unknown> {
  if (!isObject(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}
