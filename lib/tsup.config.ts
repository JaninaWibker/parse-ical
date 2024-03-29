import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'index.ts'
  },
  clean: true,
  dts: true,
  target: 'esnext',
  format: ['esm', 'cjs'],
  sourcemap: true,
  minify: false
})
