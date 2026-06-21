import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/sql/index.ts',
    'src/dsl/index.ts',
    'src/jsonlogic/index.ts',
    'src/mongodb/index.ts',
    'src/elasticsearch/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
});
