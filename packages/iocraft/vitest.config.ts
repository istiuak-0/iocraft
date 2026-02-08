import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __DEV__: 'true',
    __TEST__: 'true',
    __USE_DEVTOOLS__: 'false',
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    benchmark: {},
  },
});
