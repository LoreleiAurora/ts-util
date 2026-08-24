import { isDefined } from './is-defined.js';

/**
 * Determines whether a value is a non-null object, including arrays,
 * class instances, and built-in objects such as `Date`, `Map`, and `RegExp`.
 *
 * This is intentionally broader than {@link isRecord}. Use `isRecord` when you
 * specifically need a plain object (literal `{}` or `Object.create(null)`).
 */
export function isObject(value: unknown): value is object {
  return isDefined(value) && typeof value === 'object';
}
