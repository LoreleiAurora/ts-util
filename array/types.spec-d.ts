/** biome-ignore-all lint/correctness/noUnusedVariables: Type Testing */
import type {
  ArrayElement,
  NonEmptyArray,
  ReadonlyNonEmptyArray,
  Unarray,
} from './types.js';

type Equal<T, U> =
  (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2
    ? true
    : false;

type Expect<T extends true> = T;

// ArrayElement

type ArrayElementFromTuple = Expect<
  Equal<ArrayElement<readonly ['a', 1]>, 'a' | 1>
>;

type ArrayElementFromArray = Expect<Equal<ArrayElement<string[]>, string>>;

type ArrayElementFromReadonlyArray = Expect<
  Equal<ArrayElement<readonly number[]>, number>
>;

// Unarray

type UnarrayFromArray = Expect<Equal<Unarray<string[]>, string>>;

type UnarrayFromReadonlyArray = Expect<
  Equal<Unarray<readonly string[]>, string>
>;

type UnarrayFromTuple = Expect<Equal<Unarray<readonly [boolean]>, boolean>>;

type UnarrayFromNonArray = Expect<Equal<Unarray<number>, number>>;

type UnarrayFromUnion = Expect<
  Equal<Unarray<string[] | number>, string | number>
>;

// NonEmptyArray

const mutable: NonEmptyArray<string> = ['first'];

void mutable;

// @ts-expect-error A non-empty array requires at least one item.
const emptyMutable: NonEmptyArray<string> = [];

void emptyMutable;

// ReadonlyNonEmptyArray

const readonly: ReadonlyNonEmptyArray<string> = ['first'];

void readonly;

// @ts-expect-error A non-empty array requires at least one item.
const emptyReadonly: ReadonlyNonEmptyArray<string> = [];

void emptyReadonly;
