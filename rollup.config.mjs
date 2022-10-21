import replace from "@rollup/plugin-replace";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
// import typescript from '@rollup/plugin-typescript';
// import { babel } from '@rollup/plugin-babel';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const dist = name => name === "index" ? "dist" : "dist-test";

const browserTpl = (input, name = "index") => ({
    input,
    output: [{
        dir: dist(name),
        entryFileNames: `${name}.js`,
        chunkFileNames: `${name}-[hash].js`,
        format: "umd",
        name: pkg.name,
        sourcemap: true
    }, {
        dir: dist(name),
        entryFileNames: `${name}.mjs`,
        chunkFileNames: `${name}-[hash].mjs`,
        format: "es",
        sourcemap: true
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
        sourcemap: true
    }, {
        dir: dist(name),
        entryFileNames: `${name}-node.mjs`,
        chunkFileNames: `${name}-node-[hash].mjs`,
        format: "es",
        sourcemap: true
    }],
    plugins: [
        replace({
            preventAssignment: true,
            include: ["build/**/*.js", "lib-esm/**/*.js"],
            delimiters: ['', ''],
            values: {
                "document": "undefined",
                "fetch-browser": "fetch-node"
            }
        }),
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({}),
        // babel({ babelHelpers: "bundled" })
    ]
});

export default [
    browserTpl("lib-esm/index"),
    nodeTpl("lib-esm/index"),

    browserTpl("lib-esm/__tests__/index", "test"),
    nodeTpl("lib-esm/__tests__/index", "test"),
];
