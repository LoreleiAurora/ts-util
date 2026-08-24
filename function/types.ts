/**
 * A callable function with controls for pending work.
 */
export type CancelableFunction<TArgs extends unknown[]> = {
  (...args: TArgs): void;
  cancel(): void;
  flush(): void;
};
