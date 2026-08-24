/**
 * Materializes an object or intersection type into a readable object shape.
 */
export type Simplify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Extracts the union of property values from an object type.
 */
export type ValueOf<T extends object> = T[keyof T];

/**
 * Extracts keys whose entire value type is assignable to `TValue`.
 */
export type KeysOfType<T extends object, TValue> = {
  [K in keyof T]-?: [T[K]] extends [TValue] ? K : never;
}[keyof T];

/**
 * Replaces matching properties in `TBase` with properties from `TOverride`.
 */
export type Override<TBase, TOverride> = Simplify<
  Omit<TBase, keyof TOverride> & TOverride
>;

/**
 * Extracts keys declared as optional properties.
 */
export type OptionalKeys<T extends object> = {
  // biome-ignore lint/complexity/noBannedTypes: intentionally accepts any non-nullish value
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Extracts keys declared as required properties.
 */
export type RequiredKeys<T extends object> = Exclude<keyof T, OptionalKeys<T>>;

/**
 * Makes optional properties required and required properties optional.
 *
 * `undefined` is removed from formerly optional properties, while `null` is
 * retained.
 */
export type InvertOptionality<T extends object> = Simplify<
  {
    [K in OptionalKeys<T>]-?: Exclude<T[K], undefined>;
  } & {
    [K in RequiredKeys<T>]+?: T[K];
  }
>;

/**
 * Makes the top-level properties of a type writable.
 */
export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Requires at least one property from `TKeys`.
 */
export type RequireAtLeastOne<T, TKeys extends keyof T = keyof T> = Simplify<
  Pick<T, Exclude<keyof T, TKeys>> &
    {
      [K in TKeys]-?: Required<Pick<T, K>> &
        Partial<Pick<T, Exclude<TKeys, K>>>;
    }[TKeys]
>;

/**
 * Requires exactly one property from `TKeys`.
 *
 * Enable `exactOptionalPropertyTypes: true` for strict enforcement.
 * Without it, TypeScript allows excluded properties to be explicitly assigned
 * `undefined`, such as `{ url: 'https://example.com', socketPath: undefined }`.
 */
export type RequireExactlyOne<T, TKeys extends keyof T = keyof T> = Simplify<
  Pick<T, Exclude<keyof T, TKeys>> &
    {
      [K in TKeys]-?: Required<Pick<T, K>> &
        Partial<Record<Exclude<TKeys, K>, never>>;
    }[TKeys]
>;
