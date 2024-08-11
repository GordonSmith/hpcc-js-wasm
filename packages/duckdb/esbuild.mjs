import { browserTpl, neutralTpl, nodeTpl } from "@hpcc-js/esbuild-plugins";

//  config  ---
await browserTpl("src/index.ts", "dist/index");
await Promise.all([
    browserTpl("test/index-browser.ts", "dist-test/index.browser")
]);

