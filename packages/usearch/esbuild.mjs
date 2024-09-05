import { browserTpl, neutralTpl, nodeTpl } from "@hpcc-js/esbuild-plugins";

//  config  ---
await nodeTpl("src/index.ts", "dist/index");
await Promise.all([
    // browserTpl("test/index-browser.ts", "dist-test/index.browser"),
    nodeTpl("test/index-node.ts", "dist-test/index.node"),
    nodeTpl("test/worker-node.ts", "dist-test/worker.node")
]);

