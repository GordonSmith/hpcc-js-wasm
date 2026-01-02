import load, { reset } from "./loader.ts";

type MainModule = Awaited<ReturnType<typeof load>>;

let g_lz4Asm: Promise<LZ4Asm>;

export class LZ4Asm {

    private readonly _mainModule: MainModule;

    private constructor(_module: MainModule) {
        this._mainModule = _module;
    }

    static load(): Promise<LZ4Asm> {
        if (!g_lz4Asm) {
            g_lz4Asm = (async () => {
                const module = await load({
                    env: {
                        abort: (_msgPtr: number, _filePtr: number, line: number, col: number) => {
                            throw new Error(`AssemblyScript abort at ${line}:${col}`);
                        }
                    }
                });
                return new LZ4Asm(module);
            })();
        }
        return g_lz4Asm;
    }

    static unload() {
        reset();
        g_lz4Asm = undefined as unknown as Promise<LZ4Asm>;
    }

    /**
     * Compresses to a custom wire format:
     * `[u32le originalLength] + [lz4 block payload]`.
     */
    compress(data: Uint8Array): Uint8Array {
        this._mainModule.heap_reset();

        const ptr = this._mainModule.malloc(data.byteLength);
        new Uint8Array(this._mainModule.memory.buffer, ptr, data.byteLength).set(data);

        const outPtr = this._mainModule.lz4_compress(ptr, data.byteLength);
        const outLen = this._mainModule.lz4_compress_len();
        const outBytes = new Uint8Array(this._mainModule.memory.buffer, outPtr, outLen);

        const ret = new Uint8Array(outBytes);
        this._mainModule.heap_reset();
        return ret;
    }

    decompress(compressed: Uint8Array): Uint8Array {
        this._mainModule.heap_reset();

        const ptr = this._mainModule.malloc(compressed.byteLength);
        new Uint8Array(this._mainModule.memory.buffer, ptr, compressed.byteLength).set(compressed);

        const outPtr = this._mainModule.lz4_decompress(ptr, compressed.byteLength);
        const outLen = this._mainModule.lz4_decompress_len();
        const outBytes = new Uint8Array(this._mainModule.memory.buffer, outPtr, outLen);

        const ret = new Uint8Array(outBytes);
        this._mainModule.heap_reset();
        return ret;
    }
}
