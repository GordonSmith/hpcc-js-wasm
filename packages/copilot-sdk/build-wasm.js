import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import { componentize } from "@bytecodealliance/componentize-js";

const outDir = "../../build/packages/copilot-sdk";
const wasmOut = `${outDir}/copilot-sdklib.wasm`;
const tempJs = `${outDir}/copilot-sdklib.js`;

// Ensure output directory exists
mkdirSync(outDir, { recursive: true });

// Step 1: Bundle src-ts/ into a single ESM JS file (componentize-js requires
//         a single self-contained module).
await build({
    entryPoints: ["src-ts/copilot-sdk.ts"],
    bundle: true,
    outfile: tempJs,
    format: "esm",
    platform: "neutral",
    target: "es2020",
    // All deps must be bundled — the WASM component has no npm resolution.
    external: [],
});

// Step 2: Compile the bundled JS to a WASM Component targeting WASI preview 2.
//
//   - The component exports `handle(request: string) -> string` as declared in
//     wit/world.wit.
//   - fetch() calls are automatically bridged to wasi:http/outgoing-handler by
//     componentize-js, so the host must grant that capability.
//   - Additional WASI interfaces (filesystem, clocks, …) are pulled in by the
//     SpiderMonkey-based JS engine that componentize-js embeds.
//
// Java/C++ embedders: use wasmtime (or any WASI preview-2 runtime) to load
// copilot-sdklib.wasm and provide WASI http with the GitHub Copilot domain
// allowed.
const source = await readFile(tempJs, "utf-8");
const { component } = await componentize(source, {
    witPath: resolve("./wit"),
    worldName: "copilot-sdk",
    // AOT compilation requires platform-specific Cranelift tooling; disabled
    // for portability.  Enable in production CI for smaller, faster output.
    enableAot: false,
});

writeFileSync(wasmOut, component);

// Step 3: Remove the intermediate JS — it would confuse the sfx-wrapper loader
//         (which looks for Emscripten *.js stubs) and is not needed for dist.
unlinkSync(tempJs);

console.log(`✓ WASM component built: ${wasmOut}`);
