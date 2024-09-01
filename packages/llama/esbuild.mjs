import { browserTpl, neutralTpl, nodeTpl } from "@hpcc-js/esbuild-plugins";

//  config  ---
await neutralTpl("src/index.ts", "dist/index");
await Promise.all([
    browserTpl("test/index-browser.ts", "dist-test/index.browser"),
    nodeTpl("test/index-node.ts", "dist-test/index.node"),
    nodeTpl("test/index-docs.ts", "dist-test/index-docs.node", "esm"),
    nodeTpl("test/retrieve-docs.ts", "dist-test/retrieve-docs.node", "esm"),
]);

