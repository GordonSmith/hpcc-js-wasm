import type { PluginBuild, Plugin } from "esbuild";

export function problemMatcher(): Plugin {
    return {
        name: "problem-matcher",

        setup(build: PluginBuild) {

            build.onStart(() => {
                console.log("[watch] build started");
            });

            build.onEnd((result) => {
                result.errors.forEach(({ text, location }) => {
                    console.error(`✘ [ERROR] ${text}`);
                    console.error(`    ${location?.file}:${location?.line}:${location?.column}:`);
                });
                console.log("[watch] build finished");
            });
        }
    };
}
