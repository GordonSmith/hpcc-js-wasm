import { neutralTpl } from "@hpcc-js/esbuild-plugins";
import { sfxWasm } from "@hpcc-js/esbuild-plugins/sfx-wrapper";
import { replaceFunction, replaceString } from "../../utils/esbuild-plugins.js";

//  config  ---
await neutralTpl("src/index.ts", "dist/index", {
    external: ["@bytecodealliance/preview2-shim"],
    plugins: [
        replaceFunction({
            'findWasmBinary': 'const findWasmBinary=()=>"";'
        }),
        replaceString({
            "import.meta.url": "''",
        }),
        sfxWasm()
    ],
    supported: {
        'top-level-await': true
    },
    // Ensure source maps include source content for better debugging
    sourcesContent: true
});
