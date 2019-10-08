import pkg from './package.json';

export default [{
    input: 'src/index.js',
    output: [
        { file: pkg.browser, format: 'cjs' },
        { file: pkg.module, format: 'es' },
        { file: pkg.unpkg, format: 'umd', name: 'ogl' },
    ],
}];
