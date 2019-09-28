import pkg from './package.json';
import typescript from 'rollup-plugin-typescript'

export default [{
  input: 'src/index.ts',
  output: [
    { file: pkg.browser, format: 'cjs' },
    { file: pkg.module, format: 'es' },
    { file: pkg.unpkg, format: 'umd', name: 'ogl' }
  ],
  plugins: [
    typescript()
  ]
}];
