import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    iocraft: "./src/core.ts",
  },
  format: "esm",
  dts: true,
  clean: true,
  outDir: "dist",
});
