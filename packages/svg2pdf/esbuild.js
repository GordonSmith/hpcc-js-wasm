import { neutralTpl } from "@hpcc-js/esbuild-plugins";
import { transpile } from "@bytecodealliance/jco";

//  config  ---
await neutralTpl("src/index.ts", "dist/index");

