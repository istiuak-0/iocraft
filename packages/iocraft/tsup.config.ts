import { defineConfig } from 'tsup';

const __DEV__ = '(process.env.NODE_ENV !== "production")';
const __TEST__ = '(process.env.NODE_ENV === "test")';
export default defineConfig({
  entry: {
    core: './src/core.ts',
    helpers: './src/helpers.ts',
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
    __DEV__,
    __TEST__,
    __USE_DEVTOOLS__: `((${__DEV__} || __VUE_PROD_DEVTOOLS__) && !${__TEST__})`,
  },

  esbuildOptions(options) {
    options.target = 'es2022';
    options.banner = { js: '"use strict";' };
  },
});
