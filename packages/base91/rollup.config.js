import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import sourcemaps from "rollup-plugin-sourcemaps";
import replace from "@rollup/plugin-replace";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("./package.json");
const browserTpl = (input, umdOutput, esOutput) => ({
    input: input,
    output: [{
        file: umdOutput,
        format: "umd",
        sourcemap: true,
        name: pkg.name
    }, {
        file: esOutput + ".js",
        format: "es",
        sourcemap: true
    }],
    plugins: [
        alias({}),
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({}),
        sourcemaps()
    ]
});
const nodeTpl = (input, cjsOutput, esOutput) => ({
    input: input,
    external: ["fs", "crypto", "path"],
    output: [{
        file: cjsOutput,
        format: "cjs",
        sourcemap: true,
        name: pkg.name,
        strict: false
    }, {
        file: esOutput + ".js",
        format: "es",
        sourcemap: true
    }],
    plugins: [
        alias({
            entries: [
                { find: "../../../build/packages/base91/base91", replacement: "../../../build/packages/base91/base91.node" }
            ]
        }),
        replace({
            preventAssignment: true,
            ".node.wasm": ".wasm"
        }),
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({}),
        sourcemaps()
    ]
});

export default [
    browserTpl("lib-es6/index", pkg.browser, pkg.module),
    // nodeTpl("lib-es6/index", pkg.main, pkg["module-node"]),

    browserTpl("lib-es6/index.spec", "lib-test/index.js", "lib-test/index.es6"),
    // nodeTpl("lib-es6/index.spec", "lib-test/index.node.js", "lib-test/index.node.es6")
];