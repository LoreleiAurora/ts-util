type AnyFunction = (...args: never[]) => unknown;

/**
 * Recursively makes object properties optional while preserving functions and
 * common built-in object types.
 */
export type DeepPartial<T> = T extends AnyFunction
  ? T
  : T extends Date | Error | RegExp
    ? T
    : T extends Promise<infer TValue>
      ? Promise<TValue>
      : T extends Map<infer TKey, infer TValue>
        ? Map<TKey, TValue>
        : T extends ReadonlyMap<infer TKey, infer TValue>
          ? ReadonlyMap<TKey, TValue>
          : T extends Set<infer TValue>
            ? Set<TValue>
            : T extends ReadonlySet<infer TValue>
              ? ReadonlySet<TValue>
              : T extends WeakMap<infer TKey, infer TValue>
                ? WeakMap<TKey, TValue>
                : T extends WeakSet<infer TValue>
                  ? WeakSet<TValue>
                  : T extends readonly unknown[]
                    ? {
                        [K in keyof T]: DeepPartial<T[K]>;
                      }
                    : T extends object
                      ? {
                          [K in keyof T]?: DeepPartial<T[K]>;
                        }
                      : T;
