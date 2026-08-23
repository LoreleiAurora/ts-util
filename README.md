# @l5i/ts-util

General-purpose TypeScript utilities

- [`invariant`](#invariant)

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
