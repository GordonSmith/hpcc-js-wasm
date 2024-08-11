import { browserTpl, neutralTpl, nodeTpl } from "@hpcc-js/esbuild-plugins";

//  config  ---
await neutralTpl("src/index.ts", "dist/index");
await Promise.all([
    browserTpl("test/index-browser.ts", "dist-test/index.browser"),
    nodeTpl("test/index-node.ts", "dist-test/index.node"),
]);

