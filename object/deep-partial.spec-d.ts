/** biome-ignore-all lint/correctness/noUnusedVariables: Type Testing */
import type { DeepPartial } from './deep-partial.js';

type Equal<T, U> =
  (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2
    ? true
    : false;

type Expect<T extends true> = T;

// Nested objects become deeply optional

type NestedObjectTest = Expect<
  Equal<
    DeepPartial<{
      name: string;
      nested: {
        enabled: boolean;
      };
    }>,
    {
      name?: string;
      nested?: {
        enabled?: boolean;
      };
    }
  >
>;

// Readonly arrays and tuples preserve structure with partial elements

type ReadonlyArrayTest = Expect<
  Equal<DeepPartial<readonly { id: string }[]>, readonly { id?: string }[]>
>;

type TupleTest = Expect<
  Equal<
    DeepPartial<readonly [{ id: string }, number]>,
    readonly [{ id?: string }, number]
  >
>;

// Functions are preserved

type Callback = (value: string) => number;

type FunctionTest = Expect<Equal<DeepPartial<Callback>, Callback>>;

// Built-in objects are preserved

type DateTest = Expect<Equal<DeepPartial<Date>, Date>>;

type RegExpTest = Expect<Equal<DeepPartial<RegExp>, RegExp>>;

type ErrorTest = Expect<Equal<DeepPartial<Error>, Error>>;

// Collections are preserved

type MapTest = Expect<
  Equal<DeepPartial<Map<string, number>>, Map<string, number>>
>;

type SetTest = Expect<Equal<DeepPartial<Set<string>>, Set<string>>>;

// Promises are preserved

type PromiseTest = Expect<Equal<DeepPartial<Promise<string>>, Promise<string>>>;

// Primitives are unchanged

type StringTest = Expect<Equal<DeepPartial<string>, string>>;

type NumberTest = Expect<Equal<DeepPartial<number>, number>>;

// Union types

type UnionTest = Expect<
  Equal<
    DeepPartial<{ id: string } | { count: number }>,
    { id?: string } | { count?: number }
  >
>;
