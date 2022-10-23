import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const dist = name => name === "test" ? "dist-test" : "dist";

const browserTpl = (input, name = "index") => ({
    input,
    output: [{
        dir: dist(name),
        entryFileNames: `${name}-umd.js`,
        chunkFileNames: `${name}-umd-[hash].js`,
        format: "umd",
        name: pkg.name,
        sourcemap: false
    }, {
        dir: dist(name),
        entryFileNames: `${name}.js`,
        chunkFileNames: `${name}-[hash].js`,
        format: "es",
        sourcemap: false
    }],
    plugins: [
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({}),
        // babel({ babelHelpers: "bundled" })
    ]
});

const nodeTpl = (input, name = "index") => ({
    input,
    //external: ["fs", "crypto", "path"],
    output: [{
        dir: dist(name),
        entryFileNames: `${name}-node.cjs`,
        chunkFileNames: `${name}-node-[hash].cjs`,
        format: "cjs",
        sourcemap: false
    }, {
        dir: dist(name),
        entryFileNames: `${name}-node.js`,
        chunkFileNames: `${name}-node-[hash].js`,
        format: "es",
        sourcemap: false
    }],
    plugins: [
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({}),
        // babel({ babelHelpers: "bundled" })
    ]
});

export default [
    browserTpl("lib-esm/index"),
    browserTpl("lib-esm/graphviz", "graphviz"),
    browserTpl("lib-esm/expat", "expat"),

    nodeTpl("lib-esm/index-node"),

    browserTpl("lib-esm/__tests__/index", "test"),
    nodeTpl("lib-esm/__tests__/index", "test"),
];
