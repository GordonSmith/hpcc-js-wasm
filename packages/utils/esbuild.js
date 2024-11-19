import { browserTpl, nodeTpl } from "@hpcc-js/esbuild-plugins";

//  config  ---
await Promise.all([
    browserTpl("src/index.ts", "dist/index"),
    nodeTpl("src/index-node.ts", "dist/index-node")
]);
