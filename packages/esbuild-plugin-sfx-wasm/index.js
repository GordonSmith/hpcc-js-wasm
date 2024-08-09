import { readFile } from "fs/promises";
import { Base91, Zstd } from "@hpcc-js/wasm";

export default function (options) {
    return {
        name: "esbuild-plugin-sfx-wasm",
        setup(build) {
            build.onLoad({ filter: /\.wasm$/ }, async args => {
                const wasm = await readFile(args.path);
                const wrapperPath = args.path.replace(/\.wasm$/, ".js");
                const zstd = await Zstd.load();
                const data = zstd.compress(wasm);
                const base91 = await Base91.load();
                const str = base91.encode(data);

                const contents = `\
import { decompress } from "fzstd";

const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_\`{|}~"';

function decode(raw: string): Uint8Array {
    const len = raw.length;
    const ret: number[] = [];

    let b = 0;
    let n = 0;
    let v = -1;

    for (let i = 0; i < len; i++) {
        const p = table.indexOf(raw[i]);
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

export function extract(raw: string): Uint8Array {
    const compressed = decode(raw);
    return decompress(compressed);
}

import wrapper from "${wrapperPath}";

const blobStr = '${str}';

let g_module;
let g_wasmBinary;
export function loadWasm() {
    if (!g_wasmBinary) {
        g_wasmBinary = extract(blobStr)
    }
    if (!g_module) {
        g_module = wrapper({
            wasmBinary: g_wasmBinary,
            locateFile: undefined
        });
    }
    return g_module;
}

export function unloadWasm() {
    if (g_module) {
        g_module = undefined;
    }
}
            `.trim();

                return {
                    contents,
                    loader: "ts",
                };
            })
        }
    }
};
