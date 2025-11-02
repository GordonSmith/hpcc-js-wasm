import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/rollup-test.js',
    output: {
        file: 'dist/rollup-test.js',
        format: 'es',
        inlineDynamicImports: true
    },
    plugins: [
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs()
    ],
    external: (id) => {
        // Keep Node.js built-ins external
        if (id.startsWith('node:') || ['fs', 'path', 'crypto', 'util', 'url', 'worker_threads', 'process'].includes(id)) {
            return true;
        }
        // Keep preview2-shim external to avoid bundling issues with worker threads
        if (id.includes('@bytecodealliance/preview2-shim')) {
            return true;
        }
        // Keep WASM packages external so they can be dynamically imported properly
        if (id.includes('@hpcc-js/wasm-')) {
            return true;
        }
        return false;
    }
};
