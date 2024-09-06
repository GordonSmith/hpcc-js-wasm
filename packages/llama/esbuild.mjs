import { nodeTpl, browserTpl, neutralTpl } from "@hpcc-js/esbuild-plugins";

//  config  ---
await neutralTpl("src/index.ts", "dist/index");
await Promise.all([
    browserTpl("src/worker-browser.ts", "dist/worker-browser", "esm", undefined, undefined, ["@hpcc-js/wasm-llama"]),
    browserTpl("test/index-browser.ts", "dist-test/index.browser"),
    nodeTpl("test/index-node.ts", "dist-test/index.node"),
]);

