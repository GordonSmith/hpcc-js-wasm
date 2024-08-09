import * as process from "process";
import { readFileSync } from "fs";
import * as esbuild from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper";
import sfxWasm from "../esbuild-plugin";
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

//  plugins  ---
let wasmPlugin = {
    name: 'wasm',
    setup(build) {
        // Resolve ".wasm" files to a path with a namespace
        build.onResolve({ filter: /\.wasm$/ }, args => {
            // If this is the import inside the stub module, import the
            // binary itself. Put the path in the "wasm-binary" namespace
            // to tell our binary load callback to load the binary file.
            if (args.namespace === 'wasm-stub') {
                return {
                    path: args.path,
                    namespace: 'wasm-binary',
                }
            }

            // Otherwise, generate the JavaScript stub module for this
            // ".wasm" file. Put it in the "wasm-stub" namespace to tell
            // our stub load callback to fill it with JavaScript.
            //
            // Resolve relative paths to absolute paths here since this
            // resolve callback is given "resolveDir", the directory to
            // resolve imports against.
            if (args.resolveDir === '') {
                return // Ignore unresolvable paths
            }
            return {
                path: path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path),
                namespace: 'wasm-stub',
            }
        })

        // Virtual modules in the "wasm-stub" namespace are filled with
        // the JavaScript code for compiling the WebAssembly binary. The
        // binary itself is imported from a second virtual module.
        build.onLoad({ filter: /.*/, namespace: 'wasm-stub' }, async (args) => ({
            contents: `import wasm from ${JSON.stringify(args.path)}
          export default (imports) =>
            WebAssembly.instantiate(wasm, imports).then(
              result => result.instance.exports)`,
        }))

        // Virtual modules in the "wasm-binary" namespace contain the
        // actual bytes of the WebAssembly file. This uses esbuild's
        // built-in "binary" loader instead of manually embedding the
        // binary data inside JavaScript code ourselves.
        build.onLoad({ filter: /.*/, namespace: 'wasm-binary' }, async (args) => ({
            contents: await fs.promises.readFile(args.path),
            loader: 'binary',
        }))
    },
}
const excludeSourceMapPlugin = ({ filter }) => ({
    name: "excludeSourceMapPlugin",

    setup(build) {
        build.onLoad({ filter }, (args) => {
            return {
                contents:
                    readFileSync(args.path, "utf8") +
                    "\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==",
                loader: "default",
            };
        });
    },
});

const esbuildProblemMatcherPlugin = ({ filter }) => ({
    name: "esbuild-problem-matcher",

    setup(build) {
        build.onStart(() => {
            console.log("[watch] build started");
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log("[watch] build finished");
        });
    },
});

function rebuildNotify(config) {
    return {
        name: "rebuild-notify",

        setup(build) {
            build.onEnd(result => {
                console.log(`Built ${config.outfile}`);
            });
        },
    };
}

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
            rebuildNotify(config),
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
