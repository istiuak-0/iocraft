import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  external: ['vue'],
  esbuildOptions(options) {
    options.target = 'es2022';
    options.banner = {
      js: '"use strict";',
    };
  },
});
