import { defineConfig } from 'vitest/config';

const resolveExtensions = {
  extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.cjs', '.json'],
};

export default defineConfig({
  resolve: resolveExtensions,
  test: {
    root: './',
  },
});
