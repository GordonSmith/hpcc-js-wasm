import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const browserTpl = (input, umdOutput, esOutput) => ({
    input,
    output: [{
        file: umdOutput,
        format: "umd",
        name: pkg.name
    }, {
        file: esOutput,
        format: "es"
    }],
    plugins: [
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({})
    ]
});

const nodeTpl = (input, name = "index") => ({
    input,
    //external: ["fs", "crypto", "path"],
    output: [{
        dir: "dist",
        entryFileNames: `${name}-node.cjs`,
        chunkFileNames: `${name}-node-[hash].cjs`,
        format: "cjs",
        name: pkg.name
    }, {
        dir: "dist",
        entryFileNames: `${name}-node.mjs`,
        chunkFileNames: `${name}-node-[hash].mjs`,
        format: "es"
    }],
    plugins: [
        replace({
            preventAssignment: true,
            include: ["build/**/*.js", "lib-es6/**/*.js"],
            delimiters: ['', ''],
            values: {
                // "graphvizlib/graphvizlib": "graphvizlib/graphvizlib_node",
                // "expatlib/expatlib": "expatlib/expatlib_node",
                "// import fetch from": "import fetch from"
            }
        }),
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({})
    ]
});

export default [
    browserTpl("lib-es6/index", "dist/index.js", "dist/index.mjs"),
    nodeTpl("lib-es6/index"),

    browserTpl("lib-es6/__tests__/index", "dist/test.js", "dist/test.mjs"),
    nodeTpl("lib-es6/__tests__/index", "test"),
];
