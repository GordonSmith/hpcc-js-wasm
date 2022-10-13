import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const browserTpl = (input, umdOutput, esOutput) => ({
    input: input,
    output: [{
        file: umdOutput,
        format: "umd",
        sourcemap: true,
        name: pkg.name
    }, {
        file: esOutput,
        format: "es",
        sourcemap: true
    }],
    plugins: [
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({})
    ]
});

const nodeTpl = (input, cjsOutput) => ({
    input: input,
    external: ["fs", "crypto", "path"],
    output: [{
        file: cjsOutput,
        format: "cjs",
        sourcemap: true,
        name: pkg.name
    }],
    plugins: [
        replace({
            preventAssignment: true,
            include: ["build/**/*.js", "lib-es6/**/*.js"],
            delimiters: ['', ''],
            values: {
                "graphvizlib/graphvizlib": "graphvizlib/graphvizlib_node",
                "expatlib/expatlib": "expatlib/expatlib_node",
                "await browserFetch(wasmUrl)": "await nodeFetch(wasmUrl)"
            }
        }),
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({})
    ]
});

export default [
    browserTpl("lib-es6/index", pkg.browser, pkg.module),
    nodeTpl("lib-es6/index", pkg["main-node"]),

    browserTpl("lib-es6/graphviz", "dist/graphviz.js", "dist/graphviz.mjs"),
    browserTpl("lib-es6/expat", "dist/expat.js", "dist/expat.mjs"),

    browserTpl("lib-es6/__tests__/index", "dist/test.js", "dist/test.mjs"),
    nodeTpl("lib-es6/__tests__/index", "dist/test.cjs"),
];
