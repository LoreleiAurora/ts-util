import { describe, expectTypeOf, it } from 'vitest';
import type { AbstractConstructor, Constructor } from './constructor.js';

describe('constructor types', () => {
  it('should represent concrete constructors', () => {
    class User {
      public constructor(
        public readonly id: string,
        public readonly name: string,
      ) {}
    }

    expectTypeOf<typeof User>().toExtend<Constructor<User, [string, string]>>();
  });

  it('should represent abstract constructors', () => {
    abstract class Animal {
      public abstract speak(): string;
    }

    expectTypeOf<typeof Animal>().toExtend<AbstractConstructor<Animal>>();
  });
});
