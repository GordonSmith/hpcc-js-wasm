import { browserTpl } from "@hpcc-js/esbuild-plugins";

//  config  ---
await browserTpl("src/index.ts", "dist/index");
