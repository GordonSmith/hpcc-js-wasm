import { neutralTpl } from "@hpcc-js/esbuild-plugins";

/**
 * esbuild plugin that inlines WASM files as base64-encoded strings
 * @returns {import('esbuild').Plugin} esbuild plugin
 */
export const inlineWasmAsBase64 = () => {
    return {
        name: 'inline-wasm-as-base64',
        setup(build) {
            // Intercept .wasm file imports and convert to base64
            build.onLoad({ filter: /\.wasm$/ }, async (args) => {
                try {
                    const { readFile } = await import('fs/promises');

                    const wasmBuffer = await readFile(args.path);
                    const base64 = wasmBuffer.toString('base64');

                    const contents = `
                        const wasmBase64 = "${base64}";
                        const wasmBinary = Uint8Array.from(atob(wasmBase64), c => c.charCodeAt(0));
                        export default wasmBinary;
                    `;

                    return {
                        contents,
                        loader: 'js'
                    };
                } catch (error) {
                    console.warn(`[inline-wasm-as-base64] Failed to inline ${args.path}:`, error.message);
                    return null;
                }
            });

            // Intercept TypeScript/JavaScript files to replace fetch patterns with WASM URLs
            build.onLoad({ filter: /\.(ts|js|tsx|jsx)$/ }, async (args) => {
                try {
                    const { readFile } = await import('fs/promises');
                    const { resolve, dirname } = await import('path');

                    let contents = await readFile(args.path, 'utf8');
                    let modified = false;
                    const replacements = [];

                    // Step 1: Find all new URL("*.wasm", import.meta.url) patterns and track variable names
                    const urlPattern = /(?:const|let|var)\s+(\w+)\s*=\s*new\s+URL\s*\(\s*["']([^"']+\.wasm)["']\s*,\s*import\.meta\.url\s*\)/g;
                    const urlVariables = new Map(); // varName -> { wasmPath, base64 }

                    let urlMatch;
                    while ((urlMatch = urlPattern.exec(contents)) !== null) {
                        const varName = urlMatch[1];
                        const wasmRelativePath = urlMatch[2];
                        const wasmAbsolutePath = resolve(dirname(args.path), wasmRelativePath);

                        try {
                            const wasmBuffer = await readFile(wasmAbsolutePath);
                            const base64 = wasmBuffer.toString('base64');
                            urlVariables.set(varName, { wasmPath: wasmRelativePath, base64 });
                        } catch (err) {
                            console.warn(`[inline-wasm-as-base64] Could not read WASM file: ${wasmAbsolutePath}`, err.message);
                        }
                    }

                    // Step 2: Replace fetch(urlVariable) patterns with inline base64
                    for (const [varName, { base64 }] of urlVariables.entries()) {
                        // Match: globalThis.fetch(varName) or fetch(varName)
                        const fetchVarPattern = new RegExp(`(?:globalThis\\.)?fetch\\s*\\(\\s*${varName}\\s*\\)`, 'g');
                        if (fetchVarPattern.test(contents)) {
                            // Create an inline fetch that returns a Response with the base64-decoded WASM
                            const inlineFetch = `(async()=>{const b="${base64}";const u=Uint8Array.from(atob(b),c=>c.charCodeAt(0));return new Response(u,{headers:{"Content-Type":"application/wasm"}})})()`;

                            // Reset lastIndex after test
                            fetchVarPattern.lastIndex = 0;
                            contents = contents.replace(fetchVarPattern, inlineFetch);
                            modified = true;
                        }
                    }

                    // Step 3: Also handle direct inline patterns: fetch(new URL("*.wasm", import.meta.url))
                    const directFetchPattern = /(?:globalThis\.)?fetch\s*\(\s*new\s+URL\s*\(\s*["']([^"']+\.wasm)["']\s*,\s*import\.meta\.url\s*\)\s*\)/g;

                    let directMatch;
                    while ((directMatch = directFetchPattern.exec(contents)) !== null) {
                        const wasmRelativePath = directMatch[1];
                        const wasmAbsolutePath = resolve(dirname(args.path), wasmRelativePath);

                        try {
                            const wasmBuffer = await readFile(wasmAbsolutePath);
                            const base64 = wasmBuffer.toString('base64');

                            replacements.push({
                                original: directMatch[0],
                                replacement: `(async()=>{const b="${base64}";const u=Uint8Array.from(atob(b),c=>c.charCodeAt(0));return new Response(u,{headers:{"Content-Type":"application/wasm"}})})()`
                            });

                            modified = true;
                        } catch (err) {
                            console.warn(`[inline-wasm-as-base64] Could not read WASM file: ${wasmAbsolutePath}`, err.message);
                        }
                    }

                    if (replacements.length > 0) {
                        for (const { original, replacement } of replacements) {
                            contents = contents.replace(original, replacement);
                        }
                    }

                    if (modified) {
                        return {
                            contents,
                            loader: args.path.endsWith('.ts') || args.path.endsWith('.tsx') ? 'ts' : 'js'
                        };
                    }

                    return null; // Let esbuild handle it normally
                } catch (error) {
                    console.warn(`[inline-wasm-as-base64] Failed to process ${args.path}:`, error.message);
                    return null;
                }
            });
        },
    };
};

//  config  ---
await Promise.all([
    // Combined module (backward compatibility)
    neutralTpl("src/index.ts", "dist/index", {
        external: ["node:fs/promises"],
        plugins: [
            inlineWasmAsBase64()
        ]
    }),
    // Compress-only module
    neutralTpl("src/index-compress.ts", "dist/compress", {
        external: ["node:fs/promises"],
        plugins: [
            inlineWasmAsBase64()
        ]
    }),
    // Decompress-only module
    neutralTpl("src/index-decompress.ts", "dist/decompress", {
        external: ["node:fs/promises"],
        plugins: [
            inlineWasmAsBase64()
        ]
    })
]);
