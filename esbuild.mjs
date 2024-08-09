import * as process from "process";
import { readFileSync } from "fs";
import * as esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper";
import { rebuildLogger, sfxWasm } from "@hpcc-js/esbuild-plugins";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
const NODE_MJS = pkg.type === "module" ? "js" : "mjs";
const NODE_CJS = pkg.type === "module" ? "cjs" : "js";

const myYargs = yargs(hideBin(process.argv));
myYargs
    .usage("Usage: node esbuild.mjs [options]")
    .demandCommand(0, 0)
    .example("node esbuild.mjs --watch", "Bundle and watch for changes")
    .option("mode", {
        alias: "m",
        describe: "Build mode",
        choices: ["development", "production"],
        default: "production"
    })
    .option("w", {
        alias: "watch",
        describe: "Watch for changes",
        type: "boolean"
    })
    .help("h")
    .alias("h", "help")
    .epilog("https://github.com/hpcc-systems/hpcc-js-wasm")
    ;
const argv = await myYargs.argv;
const isDevelopment = argv.mode === "development";
const isProduction = !isDevelopment;
const isWatch = argv.watch;

//  helpers  ---
function build(config) {
    isDevelopment && console.log("Start:  ", config.entryPoints[0], config.outfile);
    return esbuild.build({
        ...config,
        sourcemap: "linked",
        plugins: [
            ...(config.plugins ?? []),
            sfxWasm()
        ]
    }).then(() => {
        isDevelopment && console.log("Stop:   ", config.entryPoints[0], config.outfile);
    });
}

async function watch(config) {
    await build(config);
    return esbuild.context({
        ...config,
        sourcemap: "external",
        plugins: [
            ...(config.plugins ?? []),
            rebuildLogger(config),
            sfxWasm()
        ]
    }).then(ctx => {
        return ctx.watch();
    });
}

function buildWatch(config) {
    return isWatch ? watch(config) : build(config);
}

function browserTpl(input, output, format, globalName = "", external = []) {
    return buildWatch({
        entryPoints: [input],
        outfile: `${output}.${format === "esm" ? "js" : "umd.js"}`,
        platform: "browser",
        target: "es2022",
        format,
        globalName,
        bundle: true,
        minify: isProduction,
        external,
        plugins: format === "umd" ? [umdWrapper()] : []
    });
}

function browserBoth(input, output, globalName = undefined, external = []) {
    return Promise.all([
        browserTpl(input, output, "esm", globalName, external),
        browserTpl(input, output, "umd", globalName, external)
    ]);
}

function nodeTpl(input, output, format, external = []) {
    return buildWatch({
        entryPoints: [input],
        outfile: `${output}.${format === "esm" ? NODE_MJS : NODE_CJS}`,
        platform: "node",
        target: "node20",
        format,
        bundle: true,
        minify: isProduction,
        external
    });
}

function nodeBoth(input, output, external = []) {
    return Promise.all([
        nodeTpl(input, output, "esm", external),
        nodeTpl(input, output, "cjs", external)
    ]);
}

function bothTpl(input, output, globalName = undefined, external = []) {
    return Promise.all([
        browserBoth(input, output, globalName, external),
        nodeTpl(input, output, "cjs", external)
    ]);
}

//  config  ---
await Promise.all([
    bothTpl("src-ts/base91.ts", "dist/base91", 'window["@hpcc-js/wasm"]'),
    bothTpl("src-ts/duckdb.ts", "dist/duckdb", 'window["@hpcc-js/wasm"]'),
    bothTpl("src-ts/graphviz.ts", "dist/graphviz", 'window["@hpcc-js/wasm"]'),
    bothTpl("src-ts/expat.ts", "dist/expat", 'window["@hpcc-js/wasm"]'),
    bothTpl("src-ts/zstd.ts", "dist/zstd", 'window["@hpcc-js/wasm"]')
]);
await bothTpl("src-ts/index.ts", "dist/index", 'window["@hpcc-js/wasm"]', ["./base91.js", "./duckdb.js", "./expat.js", "./graphviz.js", "./zstd.js"]);

browserBoth("src-ts/__tests__/index-browser.ts", "dist-test/index", 'window["@hpcc-js/wasm-test"]');
browserBoth("src-ts/__tests__/worker-browser.ts", "dist-test/worker", 'window["@hpcc-js/wasm-test"]');
nodeBoth("src-ts/__tests__/index-node.ts", "dist-test/index.node");
nodeBoth("src-ts/__tests__/worker-node.ts", "dist-test/worker.node");

nodeTpl("src-ts/__bin__/dot-wasm.ts", "bin/dot-wasm", "esm", ["@hpcc-js/wasm/graphviz"]);
