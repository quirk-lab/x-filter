import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/sql/index.ts', 'src/dsl/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
});
