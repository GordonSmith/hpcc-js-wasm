import type { PluginBuild, Plugin } from "esbuild";

export interface RebuildLoggerOptions {
    outfile: string;
}

export function rebuildLogger(opts: RebuildLoggerOptions): Plugin {
    return {
        name: "rebuild-logger",

        setup(build: PluginBuild) {

            build.onStart(() => {
                console.log("[watch] build started");
            });

            build.onEnd(() => {
                console.log(`Rebuilt ${opts.outfile}`);
            });
        }
    };
}
