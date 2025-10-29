import { neutralTpl } from "@hpcc-js/esbuild-plugins";
import { sfxWasm } from "@hpcc-js/esbuild-plugins/sfx-wrapper";
import { replaceFunction, replaceString } from "../../utils/esbuild-plugins.js";
import { resolve } from "path";

// Path resolution plugin for custom path mappings
const pathMappingPlugin = {
    name: 'path-mapping',
    setup(build) {
        build.onResolve({ filter: /^hpcc-js:expat\/types$/ }, args => {
            return {
                path: resolve('./src/types.ts'),
            };
        });
    }
};

//  config  ---
await neutralTpl("src/index.ts", "dist/index", {
    plugins: [
        pathMappingPlugin,
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
    }
});
