import resolve from '@rollup/plugin-node-resolve';

export default {
  input: ['src/index.js', 'src/core.js', 'src/httpStore.js'],
  output: { dir: 'dist', format: 'esm' },
  plugins: [ resolve() ]
}
