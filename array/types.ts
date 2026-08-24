/**
 * Extracts the union of element types from an array or tuple.
 */
export type ArrayElement<T extends readonly unknown[]> = T[number];

/**
 * Represents a mutable array containing at least one item.
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Represents a readonly array containing at least one item.
 */
export type ReadonlyNonEmptyArray<T> = readonly [T, ...T[]];

/**
 * Extracts an array element type, or returns `T` unchanged when it is not an
 * array.
 */
export type Unarray<T> = T extends readonly (infer TValue)[] ? TValue : T;
