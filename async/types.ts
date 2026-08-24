/**
 * Represents a value or thenable that resolves to that value.
 */
export type MaybePromise<T> = T | PromiseLike<T>;
