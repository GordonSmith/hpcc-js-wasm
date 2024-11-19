import { neutralTpl } from "@hpcc-js/esbuild-plugins";
import pkg from "./package.json" with { type: "json" };

//  config  ---
await neutralTpl("src/index.ts", "dist/index", undefined, undefined, undefined, [...Object.keys(pkg.dependencies)]);
