import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['./src/core.ts'],
    format: ['esm', 'cjs'],
    dts: { resolve: true },
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: false,
    external: ['vue', 'vue-router'],
    outDir: 'dist',
    esbuildOptions(options) {
      options.target = 'es2022';
      options.banner = { js: '"use strict";' };
    },
  },
  {
    entry: ['./src/router.ts'],
    format: ['esm', 'cjs'],
    dts: { resolve: true },
    sourcemap: true,
    clean: false,
    splitting: false,
    minify: false,
    external: ['vue', 'vue-router'],
    outDir: 'dist',
    esbuildOptions(options) {
      options.target = 'es2022';
      options.banner = { js: '"use strict";' };
    },
  },
]);
