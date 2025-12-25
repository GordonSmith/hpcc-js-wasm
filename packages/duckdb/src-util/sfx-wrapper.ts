import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Base91 } from "@hpcc-js/wasm-base91";
import { Zstd } from "@hpcc-js/wasm-zstd";
import type { Plugin, PluginBuild } from "esbuild";

function tpl(wasmJsPath: string, base91Wasm: string, base91CompressedWasm: string) {

    const compressed = (base91CompressedWasm.length + 8 * 1024) <= base91Wasm.length;
    const wasmJsExists = existsSync(wasmJsPath);

    return `\

${compressed ? 'import { decompress } from "fzstd";' : ""}
${wasmJsExists ? `import wrapper from "${wasmJsPath}";` : ""}

const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_\`{|}~"';
const decodeTable = (() => {
    const t = new Int16Array(128).fill(-1);
    for (let i = 0; i < table.length; ++i) {
        t[table.charCodeAt(i)] = i;
    }
    return t;
})();

function decode(raw: string): Uint8Array {
    const len = raw.length;
    const ret: number[] = [];

    let b = 0;
    let n = 0;
    let v = -1;

    for (let i = 0; i < len; i++) {
        const code = raw.charCodeAt(i);
        if (code >= 128) continue;
        const p = decodeTable[code];
        /* istanbul ignore next */
        if (p === -1) continue;
        if (v < 0) {
            v = p;
        } else {
            v += p * 91;
            b |= v << n;
            n += (v & 8191) > 88 ? 13 : 14;
            do {
                ret.push(b & 0xff);
                b >>= 8;
                n -= 8;
            } while (n > 7);
            v = -1;
        }
    }

    if (v > -1) {
        ret.push((b | v << n) & 0xff);
    }

    return new Uint8Array(ret);
}

const blobStr = '${compressed ? base91CompressedWasm : base91Wasm}';

let g_module: Uint8Array | undefined;
let g_wasmBinary: Uint8Array | undefined;
export default function() {
    if (!g_wasmBinary) {
        g_wasmBinary = ${compressed ? "decompress(decode(blobStr))" : "decode(blobStr)"};
    }
${!wasmJsExists ? `\
    return g_wasmBinary;
`: `\
    if (!g_module) {
        g_module = wrapper({
            wasmBinary: g_wasmBinary,
            locateFile: (name: string) => "sfx-wrapper nop"
        });
    }
    return g_module;
`}
}

export function reset() {
    g_module = undefined;
    g_wasmBinary = undefined;
} `.trim();
}

let base91Promise: Promise<Base91> | undefined;
let zstdPromise: Promise<Zstd> | undefined;
function getBase91() {
    base91Promise ??= Base91.load();
    return base91Promise;
}
function getZstd() {
    zstdPromise ??= Zstd.load();
    return zstdPromise;
}

export async function wrap(path: string) {
    console.log(`Wrapping: ${path}`);
    const [base91, zstd] = await Promise.all([getBase91(), getZstd()]);

    console.log(`  Reading WASM file...`);
    const wasm = await readFile(path);
    const wasmJsPath = path.replace(/\.wasm$/, ".js");
    const CHUNK_SIZE = 64 * 1024 * 1024;

    const base91Parts: string[] = [];
    base91.reset();
    for (let offset = 0; offset < wasm.length; offset += CHUNK_SIZE) {
        const chunk = wasm.subarray(offset, Math.min(offset + CHUNK_SIZE, wasm.length));
        base91Parts.push(base91.encodeChunk(chunk));
        console.log(`    Encoded ${Math.min(offset + CHUNK_SIZE, wasm.length)} / ${wasm.length} bytes`);
    }
    base91Parts.push(base91.encodeChunkEnd());
    const base91Wasm = base91Parts.join("");

    console.log(`  Compressing...`);
    const compressedChunks: Uint8Array[] = [];
    zstd.reset();
    for (let offset = 0; offset < wasm.length; offset += CHUNK_SIZE) {
        const chunk = wasm.subarray(offset, Math.min(offset + CHUNK_SIZE, wasm.length));
        compressedChunks.push(zstd.compressChunk(chunk));
        console.log(`    Compressed ${Math.min(offset + CHUNK_SIZE, wasm.length)} / ${wasm.length} bytes`);
    }
    compressedChunks.push(zstd.compressEnd());
    const totalLength = compressedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const compressedWasm = new Uint8Array(totalLength);
    let compressionOffset = 0;
    for (const chunk of compressedChunks) {
        compressedWasm.set(chunk, compressionOffset);
        compressionOffset += chunk.length;
    }

    console.log(`  Encoding compressed...`);
    const base91CompressedParts: string[] = [];
    base91.reset();
    for (let offset = 0; offset < compressedWasm.length; offset += CHUNK_SIZE) {
        const chunk = compressedWasm.subarray(offset, Math.min(offset + CHUNK_SIZE, compressedWasm.length));
        base91CompressedParts.push(base91.encodeChunk(chunk));
        console.log(`    Encoded ${Math.min(offset + CHUNK_SIZE, compressedWasm.length)} / ${compressedWasm.length} bytes (compressed)`);
    }
    base91CompressedParts.push(base91.encodeChunkEnd());
    const base91CompressedWasm = base91CompressedParts.join("");

    console.log(`  Creating wrapper...`);
    return tpl(wasmJsPath, base91Wasm, base91CompressedWasm);
}

export function sfxWasm(): Plugin {
    return {
        name: "sfx-wasm",

        setup(build: PluginBuild) {

            build.onLoad({ filter: /\.wasm$/ }, async args => {
                console.log(`build.onLoad: ${args.path}`);
                return {
                    contents: await wrap(args.path),
                    loader: "ts",
                };
            });
        }
    };
}
