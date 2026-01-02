import { instantiate } from "../build/decompress.js";

export default async function loadDecompress(imports: { env: unknown } = { env: undefined }) {
    // @ts-expect-error - process may not be defined in browser
    const isNodeOrBun = typeof process !== "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);

    const wasmUrl = new URL("../build/decompress.wasm", import.meta.url);

    let module: WebAssembly.Module;
    if (isNodeOrBun) {
        // @ts-expect-error - dynamic import for Node.js only
        const fs = await import("node:fs/promises");
        const wasmBuffer = await fs.readFile(wasmUrl);
        module = await globalThis.WebAssembly.compile(wasmBuffer);
    } else {
        const fetched = await globalThis.fetch(wasmUrl);
        module = await globalThis.WebAssembly.compileStreaming(fetched);
    }

    const instantiated = instantiate(module, imports);
    return instantiated;
}

export function reset() {
    // No-op for asm.js version
}
