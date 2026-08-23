# @l5i/ts-util

General-purpose TypeScript utilities

- [`invariant`](#invariant)
- [`envsubst`/`envsubstDeep`](#envsubstenvsubstdeep)

---

## `invariant`

Asserts that a condition is truthy, throwing an error if it is not. Acts as a TypeScript assertion signature (`asserts condition`), narrowing the type in all subsequent code.

```ts
function invariant(
  condition: any,
  message?: string | (() => string),
  errorClass?: new (message: string) => Error,
): asserts condition;
```

### Errors

- **`InvariantError`** - thrown when `condition` is falsy and no `errorClass` is provided. Message format: `'Invariant failed: <message>'` (or just `'Invariant failed'` if no message).
- **Custom error** - thrown when `condition` is falsy and `errorClass` is provided. Message passed as-is.

### Examples

```ts
import { invariant, InvariantError } from '@l5i/ts-util';

const value: string | null = getValue();

// Throws InvariantError if value is falsy
invariant(value, 'Expected value to be a string');

// value is now narrowed to string
value.toUpperCase();
```
```ts
import { invariant, InvariantError } from '@l5i/ts-util';

// String message - throws InvariantError
invariant(value, 'Expected value to be a person');

// Lazy message - only evaluated on failure
invariant(value, () => `Expected a person, got ${JSON.stringify(value)}`);

// Custom error class - throws ValidationError('Expected a person')
invariant(value, 'Expected a person', ValidationError);

// Lazy message + custom error class
invariant(value, () => 'Expected a person', ValidationError);
```
---


## `envsubst`/`envsubstDeep`

Replaces `${VAR}` and `${VAR:default}` expressions in strings, with recursive deep traversal for objects and arrays. `envsubstDeep` recursively applies `envsubst` to every string in an object/array tree; non-string values (numbers, booleans, null) pass through unchanged.

### Resolution order

For each `${VAR}` expression:

1. If `VAR` exists in `env` (defaults to `process.env`), its value is used.
2. Otherwise, if an inline default is present (`${VAR:fallback}`), the default is used.
3. Otherwise, `onMissing` determines behavior:
    - `'empty'` (default) - replace with an empty string.
    - `'keep'` - preserve the original `${VAR}` expression.
    - `'throw'` - throw `EnvsubstError`.

### Variable name rules

- Must start with a letter or underscore (`[A-Za-z_]`).
- Followed by any combination of letters, digits, and underscores (`[A-Za-z0-9_]`).
- Bare `$VAR` references (no braces) are not matched.
- No recursive expansion - substituted values are not re-scanned for placeholders.

```ts
interface EnvsubstOptions {
  env?: Record<string, string | undefined>;
  onMissing?: 'empty' | 'keep' | 'throw';
}

function envsubst(template: string, options?: EnvsubstOptions): string;
function envsubstDeep<T>(node: T, options: EnvsubstOptions): T;
```

### Errors

- **`EnvsubstError`** - thrown when `onMissing: 'throw'` and a `${VAR}` has no value or default. Has a `variableName` property.

### Examples

```ts
import { envsubst, envsubstDeep } from '@l5i/ts-util';

// Basic substitution
envsubst('${GREETING}, ${NAME}!', { env: { GREETING: 'Hello', NAME: 'Alice' } });
// → 'Hello, Alice!'

// Inline defaults
envsubst('${MISSING:fallback}', { env: {} });
// → 'fallback'

// Deep traversal
envsubstDeep(
  { host: '${HOST}', db: { port: '${PORT}' } },
  { env: { HOST: 'localhost', PORT: '5432' } },
);
// → { host: 'localhost', db: { port: '5432' } }

// Non-string values pass through unchanged
envsubstDeep(
  { host: '${HOST}', port: 5432, debug: true },
  { env: { HOST: 'localhost' } },
);
// → { host: 'localhost', port: 5432, debug: true }
```
