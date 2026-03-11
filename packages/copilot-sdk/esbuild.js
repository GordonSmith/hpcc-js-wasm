import { neutralTpl } from "@hpcc-js/esbuild-plugins";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

//  config  ---
await neutralTpl("src/index.ts", "dist/index", {
    external: ["@github/copilot-sdk"],
});

// Distribute the WASM Component alongside the JS bundle so that Java / C++
// consumers can load it directly from the npm package without a separate
// download.  Run `npm run build-wasm` (or the full `npm run build`) first.
// The copy is best-effort: if the WASM hasn't been built yet we just warn —
// the TypeScript build should still succeed.
const wasmSrc = resolve("../../build/packages/copilot-sdk/copilot-sdklib.wasm");
const wasmDst = resolve("dist/copilot-sdklib.wasm");
mkdirSync("dist", { recursive: true });
try {
    copyFileSync(wasmSrc, wasmDst);
    console.log("✓ copilot-sdklib.wasm copied to dist/");
} catch {
    console.warn("⚠  copilot-sdklib.wasm not found — run `npm run build-wasm` first.");
}
