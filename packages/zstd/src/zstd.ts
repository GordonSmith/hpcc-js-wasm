import { zstd } from "../../../build/packages/zstd/zstdlib.component.js";

//  Ref:  http://facebook.github.io/zstd/zstd_manual.html
//  Ref:  https://github.com/facebook/zstd

let g_zstd: Zstd | undefined;

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
export class Zstd {

    private constructor() {
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
    static async load(): Promise<Zstd> {
        if (!g_zstd) {
            // Wait a tick to ensure the component module is fully loaded
            await new Promise(resolve => setTimeout(resolve, 0));
            g_zstd = new Zstd();
        }
        return g_zstd;
    }

    /**
     * Unloades the compiled wasm instance.
     */
    static unload() {
        g_zstd = undefined;
    }

    /**
     * @returns The Zstd c++ version
     */
    version(): string {
        return zstd.version();
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
        return zstd.compress(data, compressionLevel);
    }

    /**
     * @param compressedData Data to be compressed
     * @returns Uncompressed data.
     */
    decompress(compressedData: Uint8Array): Uint8Array {
        return zstd.decompress(compressedData);
    }

    /**
     * @returns Default compression level (see notes above above).
     */
    defaultCLevel(): number {
        return zstd.defaultCLevel();
    }

    minCLevel(): number {
        return zstd.minCLevel();
    }

    maxCLevel(): number {
        return zstd.maxCLevel();
    }
}
