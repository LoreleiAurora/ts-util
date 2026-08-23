const prefix: string = 'Invariant failed';

export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}

/**
 * Asserts that `condition` is truthy, throwing an error if it is not.
 *
 * Acts as a TypeScript assertion signature (`asserts condition`), narrowing
 * the type of `condition` to non-falsy in all subsequent code.
 *
 * @throws {InvariantError} When `condition` is falsy and no `errorClass` is
 * provided.
 * @throws {Error} When `condition` is falsy and an `errorClass` is provided.
 */
export function invariant(
  // biome-ignore lint/suspicious/noExplicitAny: Any truthy value should be a passing condition.
  condition: any,
  message?: string | (() => string),
  errorClass?: new (message: string) => Error,
): asserts condition {
  if (condition) {
    return;
  }

  const raw: string =
    typeof message === 'function' ? message() : (message ?? '');

  if (errorClass) {
    throw new errorClass(raw || prefix);
  }

  throw new InvariantError(raw ? `${prefix}: ${raw}` : prefix);
}
