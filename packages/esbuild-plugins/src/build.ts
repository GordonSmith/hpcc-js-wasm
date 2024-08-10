import * as process from "process";
import { readFileSync } from "fs";
import * as path from "path";
import * as esbuild from "esbuild";
import type { BuildOptions, Format } from "esbuild";
import { umdWrapper } from "esbuild-plugin-umd-wrapper";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { rebuildLogger, sfxWasm } from "@hpcc-js/esbuild-plugins";

const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "./package.json"), "utf8"));
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

export function build(config: BuildOptions) {
    if (isDevelopment && Array.isArray(config.entryPoints)) {
        console.log("Start:  ", config.entryPoints[0], config.outfile);
    }
    return esbuild.build({
        ...config,
        sourcemap: "linked",
        plugins: [
            ...(config.plugins ?? []),
            sfxWasm()
        ]
    }).finally(() => {
        if (isDevelopment && Array.isArray(config.entryPoints)) {
            console.log("Stop:   ", config.entryPoints[0], config.outfile);
        }
    });
}

export async function watch(config: BuildOptions) {
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

export function buildWatch(config: BuildOptions) {
    return isWatch ? watch(config) : build(config);
}

export function browserTpl(input: string, output: string, format: Format | "umd" = "esm", globalName?: string, external: string[] = []) {
    return buildWatch({
        entryPoints: [input],
        outfile: `${output}.${format === "esm" ? "js" : "umd.js"}`,
        platform: "browser",
        target: "es2022",
        format: format as Format,
        globalName,
        bundle: true,
        minify: isProduction,
        external,
        plugins: format === "umd" ? [umdWrapper()] : []
    });
}

export function browserBoth(input: string, output: string, globalName?: string, external: string[] = []) {
    return Promise.all([
        browserTpl(input, output, "esm", globalName, external),
        browserTpl(input, output, "umd", globalName, external)
    ]);
}

export function nodeTpl(input: string, output: string, format: Format | "umd" = "esm", external: string[] = []) {
    return buildWatch({
        entryPoints: [input],
        outfile: `${output}.${format === "esm" ? NODE_MJS : NODE_CJS}`,
        platform: "node",
        target: "node20",
        format: format as Format,
        bundle: true,
        minify: isProduction,
        external
    });
}

export function neutralTpl(input: string, output: string, format: Format | "umd" = "esm", globalName?: string, external: string[] = []) {
    return buildWatch({
        entryPoints: [input],
        outfile: `${output}.${format === "esm" ? "js" : "umd.js"}`,
        platform: "neutral",
        target: "es2022",
        format: format as Format,
        globalName,
        bundle: true,
        minify: isProduction,
        external,
        plugins: format === "umd" ? [umdWrapper()] : []
    });
}

export function nodeBoth(input: string, output: string, external: string[] = []) {
    return Promise.all([
        nodeTpl(input, output, "esm", external),
        nodeTpl(input, output, "cjs", external)
    ]);
}

export function bothTpl(input: string, output: string, globalName?: string, external: string[] = []) {
    return Promise.all([
        browserBoth(input, output, globalName, external),
        nodeTpl(input, output, "cjs", external)
    ]);
}
