/**
 * Matches ${VAR} and ${VAR:default}.
 *
 * Group 1 – variable name: must start with a letter or underscore, followed
 *            by any combination of letters, digits, and underscores.
 * Group 2 – inline default: everything after the first colon up to the closing
 *          brace. Optional. May itself contain colons (e.g. URLs).
 */
const PATTERN = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::([^}]*))?\}/g;

export class EnvsubstError extends Error {
  constructor(public readonly variableName: string) {
    super(`envsubst: variable "${variableName}" is not defined`);
    this.name = 'EnvsubstError';
  }
}

export interface EnvsubstOptions {
  env?: Record<string, string | undefined>;
  onMissing?: 'empty' | 'keep' | 'throw';
}

/**
 * Replaces ${VAR} and ${VAR:default} expressions in a string.
 *
 * Resolution order for each variable:
 * 1. If the variable exists in `env`, its value is used.
 * 2. Otherwise, if an inline default (`${VAR:fallback}`) is present, it's used.
 * 3. Otherwise, `onMissing` determines behavior: `'empty'` (default) replaces
 *    with an empty string, `'keep'` preserves the original expression, and
 *    `'throw'` throws an {@link EnvsubstError}.
 */
export function envsubst(
  template: string,
  options: EnvsubstOptions = {},
): string {
  const { env = process.env, onMissing = 'empty' } = options;

  return template.replace(
    PATTERN,
    (match, name: string, inlineDefault: string | undefined) => {
      const value = env[name];

      if (value !== undefined) return value;
      if (inlineDefault !== undefined) return inlineDefault;

      switch (onMissing) {
        case 'keep':
          return match;
        case 'throw':
          throw new EnvsubstError(name);
        default:
          return '';
      }
    },
  );
}

/**
 * Recursively applies {@link envsubst} to every string in an object/array tree.
 * Non-string values (numbers, booleans, null) are passed through unchanged.
 */
export function envsubstDeep<T>(node: T, options: EnvsubstOptions): T {
  if (typeof node === 'string') {
    return envsubst(node, options) as T;
  }

  if (Array.isArray(node)) {
    return node.map((item) => envsubstDeep(item, options)) as T;
  }

  if (node !== null && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>).map(([k, v]) => [
        k,
        envsubstDeep(v, options),
      ]),
    ) as T;
  }

  return node;
}
