/** biome-ignore-all lint/correctness/noUnusedVariables: Type Testing */
import type {
  InvertOptionality,
  KeysOfType,
  OptionalKeys,
  Override,
  RequireAtLeastOne,
  RequiredKeys,
  RequireExactlyOne,
} from './types.js';

type Equal<T, U> =
  (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U ? 1 : 2
    ? true
    : false;

type Expect<T extends true> = T;

// OptionalKeys and RequiredKeys

type Input = {
  optional?: string | null;
  optionalUndefined?: number | undefined;
  required: boolean;
  requiredUndefined: string | undefined;
};

type OptionalKeyTest = Expect<
  Equal<OptionalKeys<Input>, 'optional' | 'optionalUndefined'>
>;

type RequiredKeyTest = Expect<
  Equal<RequiredKeys<Input>, 'required' | 'requiredUndefined'>
>;

// InvertOptionality

type InvertedTest = Expect<
  Equal<
    InvertOptionality<Input>,
    {
      optional: string | null;
      optionalUndefined: number;
      required?: boolean;
      requiredUndefined?: string | undefined;
    }
  >
>;

// KeysOfType

type KeysOfTypeTest = Expect<
  Equal<
    KeysOfType<
      {
        exact: string;
        literal: 'value';
        mixed: string | number;
        optional?: string;
      },
      string
    >,
    'exact' | 'literal'
  >
>;

type KeysOfTypeNeverTest = Expect<
  Equal<
    KeysOfType<
      {
        active: boolean;
        count: number;
      },
      string
    >,
    never
  >
>;

// Override

type OverrideTest = Expect<
  Equal<
    Override<
      {
        readonly id: number;
        name: string;
      },
      {
        id?: string;
        active: boolean;
      }
    >,
    {
      id?: string;
      name: string;
      active: boolean;
    }
  >
>;

// RequireAtLeastOne

type AtLeastOne = RequireAtLeastOne<
  {
    url?: string;
    socketPath?: string;
    timeoutMs?: number;
  },
  'url' | 'socketPath'
>;

const urlConnection: AtLeastOne = {
  url: 'https://example.com',
};

const socketConnection: AtLeastOne = {
  socketPath: '/var/run/example.sock',
  timeoutMs: 1_000,
};

void urlConnection;
void socketConnection;

// @ts-expect-error One connection field is required.
const missingConnection: AtLeastOne = {
  timeoutMs: 1_000,
};

void missingConnection;

// RequireExactlyOne

type ExactlyOne = RequireExactlyOne<
  {
    url?: string;
    socketPath?: string;
    timeoutMs?: number;
  },
  'url' | 'socketPath'
>;

const remote: ExactlyOne = {
  url: 'https://example.com',
};

const local: ExactlyOne = {
  socketPath: '/var/run/example.sock',
};

void remote;
void local;

// @ts-expect-error Exactly one connection field is required.
const neither: ExactlyOne = {
  timeoutMs: 1_000,
};

// @ts-expect-error Connection fields are mutually exclusive.
const both: ExactlyOne = {
  url: 'https://example.com',
  socketPath: '/var/run/example.sock',
};

void neither;
void both;
