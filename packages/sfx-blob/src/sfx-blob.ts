import load, { reset } from "./loader.ts";
import loadCompress, { reset as resetCompress } from "./loader-compress.ts";
import loadDecompress, { reset as resetDecompress } from "./loader-decompress.ts";

type MainModule = Awaited<ReturnType<typeof load>>;
type CompressModule = Awaited<ReturnType<typeof loadCompress>>;
type DecompressModule = Awaited<ReturnType<typeof loadDecompress>>;

let g_sfxBlob: Promise<SfxBlob>;
let g_compressor: Promise<Compressor>;
let g_decompressor: Promise<Decompressor>;

/**
 * Combined compress/decompress using a single WASM module
 */
export class SfxBlob {

    private readonly _mainModule: MainModule;
    private readonly _encoder = new TextEncoder();
    private readonly _decoder = new TextDecoder("utf-8");

    private constructor(_module: MainModule) {
        this._mainModule = _module;
    }

    static load(): Promise<SfxBlob> {
        if (!g_sfxBlob) {
            g_sfxBlob = (async () => {
                const module = await load({
                    env: {
                        abort: (_msgPtr: number, _filePtr: number, line: number, col: number) => {
                            throw new Error(`AssemblyScript abort at ${line}:${col}`);
                        }
                    }
                });
                return new SfxBlob(module);
            })();
        }
        return g_sfxBlob;
    }

    static unload() {
        reset();
        g_sfxBlob = undefined as unknown as Promise<SfxBlob>;
    }

    /**
     * Compress a blob using LZ4 compression, then encode with Base91.
     * Returns a Base91-encoded string.
     */
    compress(data: Uint8Array): string {
        this._mainModule.heap_reset();

        const ptr = this._mainModule.malloc(data.byteLength);
        new Uint8Array(this._mainModule.memory.buffer, ptr, data.byteLength).set(data);

        const outPtr = this._mainModule.sfx_compress(ptr, data.byteLength);
        const outLen = this._mainModule.sfx_compress_len();
        const outBytes = new Uint8Array(this._mainModule.memory.buffer, outPtr, outLen);

        const ret = this._decoder.decode(outBytes);
        this._mainModule.heap_reset();
        return ret;
    }

    /**
     * Decompress a Base91-encoded string by first decoding Base91, then decompressing with LZ4.
     * Returns the original decompressed data.
     */
    decompress(base91Str: string): Uint8Array {
        this._mainModule.heap_reset();

        const encoded = this._encoder.encode(base91Str);
        const ptr = this._mainModule.malloc(encoded.byteLength);
        new Uint8Array(this._mainModule.memory.buffer, ptr, encoded.byteLength).set(encoded);

        const outPtr = this._mainModule.sfx_decompress(ptr, encoded.byteLength);
        const outLen = this._mainModule.sfx_decompress_len();
        const outBytes = new Uint8Array(this._mainModule.memory.buffer, outPtr, outLen);

        const ret = new Uint8Array(outBytes);
        this._mainModule.heap_reset();
        return ret;
    }
}

/**
 * Compress-only using dedicated compress WASM module
 */
export class Compressor {

    private readonly _module: CompressModule;
    private readonly _decoder = new TextDecoder("utf-8");

    private constructor(_module: CompressModule) {
        this._module = _module;
    }

    static load(): Promise<Compressor> {
        if (!g_compressor) {
            g_compressor = (async () => {
                const module = await loadCompress({
                    env: {
                        abort: (_msgPtr: number, _filePtr: number, line: number, col: number) => {
                            throw new Error(`AssemblyScript abort at ${line}:${col}`);
                        }
                    }
                });
                return new Compressor(module);
            })();
        }
        return g_compressor;
    }

    static unload() {
        resetCompress();
        g_compressor = undefined as unknown as Promise<Compressor>;
    }

    /**
     * Compress a blob using LZ4 compression, then encode with Base91.
     * Returns a Base91-encoded string.
     */
    compress(data: Uint8Array): string {
        this._module.heap_reset();

        const ptr = this._module.malloc(data.byteLength);
        new Uint8Array(this._module.memory.buffer, ptr, data.byteLength).set(data);

        const outPtr = this._module.compress(ptr, data.byteLength);
        const outLen = this._module.compress_len();
        const outBytes = new Uint8Array(this._module.memory.buffer, outPtr, outLen);

        const ret = this._decoder.decode(outBytes);
        this._module.heap_reset();
        return ret;
    }
}

/**
 * Decompress-only using dedicated decompress WASM module
 */
export class Decompressor {

    private readonly _module: DecompressModule;
    private readonly _encoder = new TextEncoder();

    private constructor(_module: DecompressModule) {
        this._module = _module;
    }

    static load(): Promise<Decompressor> {
        if (!g_decompressor) {
            g_decompressor = (async () => {
                const module = await loadDecompress({
                    env: {
                        abort: (_msgPtr: number, _filePtr: number, line: number, col: number) => {
                            throw new Error(`AssemblyScript abort at ${line}:${col}`);
                        }
                    }
                });
                return new Decompressor(module);
            })();
        }
        return g_decompressor;
    }

    static unload() {
        resetDecompress();
        g_decompressor = undefined as unknown as Promise<Decompressor>;
    }

    /**
     * Decompress a Base91-encoded string by first decoding Base91, then decompressing with LZ4.
     * Returns the original decompressed data.
     */
    decompress(base91Str: string): Uint8Array {
        this._module.heap_reset();

        const encoded = this._encoder.encode(base91Str);
        const ptr = this._module.malloc(encoded.byteLength);
        new Uint8Array(this._module.memory.buffer, ptr, encoded.byteLength).set(encoded);

        const outPtr = this._module.decompress(ptr, encoded.byteLength);
        const outLen = this._module.decompress_len();
        const outBytes = new Uint8Array(this._module.memory.buffer, outPtr, outLen);

        const ret = new Uint8Array(outBytes);
        this._module.heap_reset();
        return ret;
    }
}
