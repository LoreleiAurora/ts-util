/**
 * Represents a concrete class constructor.
 */
export type Constructor<
  T = object,
  TArguments extends unknown[] = never[],
> = new (...args: TArguments) => T;

/**
 * Represents an abstract or concrete class constructor.
 */
export type AbstractConstructor<
  T = object,
  TArguments extends unknown[] = never[],
> = abstract new (...args: TArguments) => T;
