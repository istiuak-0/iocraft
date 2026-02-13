import { defineConfig } from 'tsup';

const NODE_ENV = process.env.NODE_ENV ?? 'production';

const __DEV__ = NODE_ENV !== 'production';
const __TEST__ = NODE_ENV === 'test';
const __USE_DEVTOOLS__ = (__DEV__ || process.env.VUE_PROD_DEVTOOLS === 'true') && !__TEST__;

export default defineConfig({
  entry: {
    core: './src/core.ts',
    common: './src/common.ts'
  },
  format: ['esm', 'cjs'],
  dts: { resolve: true },
  sourcemap: true,
  clean: true,
  splitting: true,
  minify: false,
  external: ['vue', 'vue-router', 'pinia'],
  outDir: 'dist',

  define: {
    __DEV__: JSON.stringify(__DEV__),
    __TEST__: JSON.stringify(__TEST__),
    __USE_DEVTOOLS__: JSON.stringify(__USE_DEVTOOLS__),
  },

  esbuildOptions(options) {
    options.target = 'es2022';
    options.banner = { js: '"use strict";' };
  },
});
