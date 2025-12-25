// @ts-expect-error importing from a wasm file is resolved via a custom esbuild plugin
import load, { reset } from "../../../build/packages/zstd/zstdlib.wasm";
import type { MainModule, zstd } from "../../../build/packages/zstd/zstdlib.js";
import { WasmLibrary } from "@hpcc-js/wasm-util";
type ZstdExports = MainModule["zstd"];

//  Ref:  http://facebook.github.io/zstd/zstd_manual.html
//  Ref:  https://github.com/facebook/zstd

let g_zstd: Promise<Zstd>;

/**
 * The Zstandard WASM library, provides a simplified wrapper around the Zstandard c++ library.
 * 
 * See [Zstandard](https://facebook.github.io/zstd/) for more details.
 * 
 * ```ts
 * import { Zstd } from "@hpcc-js/wasm-zstd";
 * 
 * const zstd = await Zstd.load();
 * 
 * //  Generate some "data"
 * const data = new Uint8Array(Array.from({ length: 100000 }, (_, i) => i % 256));
 * 
 * const compressed_data = zstd.compress(data);
 * const decompressed_data = zstd.decompress(compressed_data);
 * ```
 */
export class Zstd extends WasmLibrary<MainModule, zstd> {
    private _zstdClass: ZstdExports;

    private constructor(_module: MainModule) {
        super(_module, new _module.zstd());
        this._zstdClass = _module.zstd;
    }

    /**
     * Compiles and instantiates the raw wasm.
     * 
     * ::: info
     * In general WebAssembly compilation is disallowed on the main thread if the buffer size is larger than 4KB, hence forcing `load` to be asynchronous;
     * :::
     * 
     * @returns A promise to an instance of the Zstd class.
     */
    static load(): Promise<Zstd> {
        if (!g_zstd) {
            g_zstd = (load() as Promise<MainModule>).then((module) => new Zstd(module));
        }
        return g_zstd;
    }

    /**
     * Unloades the compiled wasm instance.
     */
    static unload() {
        reset();
    }

    /**
     * @returns The Zstd c++ version
     */
    version(): string {
        return this._zstdClass.version();
    }

    /**
     * Resets the internal compression/decompression state.
     */
    reset(): void {
        this._exports.reset();
    }

    /**
     * Sets the compression level for streaming compression.
     * @param level Compression level (use minCLevel() to maxCLevel())
     */
    setCompressionLevel(level: number): void {
        this._exports.setCompressionLevel(level);
    }

    /**
     * @param data Data to be compressed
     * @param compressionLevel Compression v Speed tradeoff, when omitted it will default to `zstd.defaultCLevel()` which is currently 3.
     * @returns Compressed data.
     * 
     * :::tip
     * A note on compressionLevel:  The library supports regular compression levels from 1 up o 22. Levels >= 20, should be used with caution, as they require more memory. The library also offers negative compression levels, which extend the range of speed vs. ratio preferences.  The lower the level, the faster the speed (at the cost of compression).
     * :::
     */
    compress(data: Uint8Array, compressionLevel: number = this.defaultCLevel()): Uint8Array {
        const uncompressed = this.uint8_heapu8(data);

        const compressedSize = this._zstdClass.compressBound(data.length);
        const compressed = this.malloc_heapu8(compressedSize);
        compressed.size = this._zstdClass.compress(compressed.ptr, compressedSize, uncompressed.ptr, uncompressed.size, compressionLevel);
        /* istanbul ignore if  */
        if (this._zstdClass.isError(compressed.size)) {
            console.error(this._zstdClass.getErrorName(compressed.size));
        }
        const retVal = this.heapu8_uint8(compressed);

        this.free_heapu8(compressed);
        this.free_heapu8(uncompressed);
        return retVal;
    }

    /**
     * Compresses a chunk of data in streaming mode.
     * Call reset() before the first chunk, then compressChunk() for each chunk, and finally compressEnd().
     * @param data Chunk of data to be compressed
     * @returns Compressed chunk data
     */
    compressChunk(data: Uint8Array): Uint8Array {
        const uncompressed = this.uint8_heapu8(data);
        // For streaming compression, we need enough space for:
        // 1. The compressed data (compressBound gives worst case)
        // 2. Additional overhead for frame headers and internal buffering
        // Use compressBound + CStreamOutSize to ensure we have enough
        const boundSize = this._zstdClass.compressBound(data.length);
        const streamOutSize = this._zstdClass.CStreamOutSize();
        const compressedSize = boundSize + streamOutSize;
        const compressed = this.malloc_heapu8(compressedSize);

        compressed.size = this._exports.compressChunk(compressed.ptr, compressedSize, uncompressed.ptr, uncompressed.size);

        // Check for errors before trying to use the size
        if (this._zstdClass.isError(compressed.size)) {
            const errorName = this._zstdClass.getErrorName(compressed.size);
            this.free_heapu8(compressed);
            this.free_heapu8(uncompressed);
            throw new Error(`compressChunk failed: ${errorName} (data.length=${data.length}, compressedSize=${compressedSize})`);
        }

        const retVal = this.heapu8_uint8(compressed);

        this.free_heapu8(compressed);
        this.free_heapu8(uncompressed);
        return retVal;
    }

    /**
     * Finishes the streaming compression and returns any remaining compressed data.
     * @returns Final compressed data
     */
    compressEnd(): Uint8Array {
        const compressedSize = this._zstdClass.CStreamOutSize(); // Recommended buffer size for output
        const compressed = this.malloc_heapu8(compressedSize);

        compressed.size = this._exports.compressEnd(compressed.ptr, compressedSize);

        // Check for errors before trying to use the size
        if (this._zstdClass.isError(compressed.size)) {
            const errorName = this._zstdClass.getErrorName(compressed.size);
            this.free_heapu8(compressed);
            throw new Error(`compressEnd failed: ${errorName} (compressedSize=${compressedSize})`);
        }

        const retVal = this.heapu8_uint8(compressed);

        this.free_heapu8(compressed);
        return retVal;
    }

    /**
     * @param compressedData Data to be compressed
     * @returns Uncompressed data.
     */
    decompress(compressedData: Uint8Array): Uint8Array {
        const compressed = this.uint8_heapu8(compressedData);
        let uncompressedSize = this._zstdClass.getFrameContentSize(compressed.ptr, compressed.size);

        // Check if size is unknown (happens with streaming compression)
        // ZSTD_CONTENTSIZE_UNKNOWN is (uint64_t)-1, which becomes a very large number in JS
        const CONTENTSIZE_UNKNOWN = 0xFFFFFFFFFFFFFFFF;  // Will be represented as ~18.4e18 in JS

        /* istanbul ignore if  */
        if (this._zstdClass.isError(uncompressedSize)) {
            const errorName = this._zstdClass.getErrorName(uncompressedSize);
            this.free_heapu8(compressed);
            throw new Error(`Failed to get frame content size: ${errorName}`);
        }

        // If content size is unknown, use a reasonable upper bound
        // For safety, use decompression bound or a multiple of compressed size
        if (uncompressedSize >= CONTENTSIZE_UNKNOWN || uncompressedSize === 0) {
            // Use a heuristic: decompressed data is typically 2-10x compressed size for text/structured data
            // Allocate generously to avoid buffer overflow
            uncompressedSize = Math.max(compressed.size * 20, 1024 * 1024); // At least 1MB or 20x compressed
        }

        const uncompressed = this.malloc_heapu8(uncompressedSize);

        uncompressed.size = this._zstdClass.decompress(uncompressed.ptr, uncompressedSize, compressed.ptr, compressed.size);
        /* istanbul ignore if  */
        if (this._zstdClass.isError(uncompressed.size)) {
            const errorName = this._zstdClass.getErrorName(uncompressed.size);
            this.free_heapu8(uncompressed);
            this.free_heapu8(compressed);
            throw new Error(`Decompression failed: ${errorName}`);
        }
        const retVal = this.heapu8_uint8(uncompressed);

        this.free_heapu8(uncompressed);
        this.free_heapu8(compressed);
        return retVal;
    }

    /**
     * Decompresses a chunk of data in streaming mode.
     * Call reset() before the first chunk, then decompressChunk() for each chunk.
     * @param compressedData Chunk of compressed data
     * @param outputSize Expected output size for this chunk
     * @returns Decompressed chunk data
     */
    decompressChunk(compressedData: Uint8Array, outputSize: number): Uint8Array {
        const compressed = this.uint8_heapu8(compressedData);
        const uncompressed = this.malloc_heapu8(outputSize);

        uncompressed.size = this._exports.decompressChunk(uncompressed.ptr, outputSize, compressed.ptr, compressed.size);
        const retVal = this.heapu8_uint8(uncompressed);

        this.free_heapu8(uncompressed);
        this.free_heapu8(compressed);
        return retVal;
    }

    /**
     * @returns Default compression level (see notes above above).
     */
    defaultCLevel(): number {
        return this._zstdClass.defaultCLevel();
    }

    minCLevel(): number {
        return this._zstdClass.minCLevel();
    }

    maxCLevel(): number {
        return this._zstdClass.maxCLevel();
    }
}
