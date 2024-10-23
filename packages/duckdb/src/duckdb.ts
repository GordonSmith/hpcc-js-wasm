// @ts-expect-error importing from a wasm file is resolved via a custom esbuild plugin
import load, { reset } from "../../../build/packages/duckdb/src-cpp/duckdblib.wasm";
import { WasmLibrary } from "./wasm-library.ts";

//  Ref:  http://duckdb.sourceforge.net/#a5

let g_duckdb: Promise<DuckDB>;

/**
 * Base 91 WASM library, similar to Base 64 but uses more characters resulting in smaller strings.
 * 
 * See [DuckDB](https://duckdb.sourceforge.net/) for more details.
 *
 * ```ts
 * import { DuckDB } from "@hpcc-js/wasm-duckdb";
 * 
 * const duckdb = await DuckDB.load();
 * 
 * const encoded_data = await duckdb.encode(data);
 * const decoded_data = await duckdb.decode(encoded_data);
 * ```
 */
export class DuckDB extends WasmLibrary {

    private constructor(_module: any) {
        super(_module, new _module.CDuckDB());
    }

    /**
     * Compiles and instantiates the raw wasm.
     * 
     * ::: info
     * In general WebAssembly compilation is disallowed on the main thread if the buffer size is larger than 4KB, hence forcing `load` to be asynchronous;
     * :::
     * 
     * @returns A promise to an instance of the DuckDB class.
     */
    static load(): Promise<DuckDB> {
        if (!g_duckdb) {
            g_duckdb = load().then((module: any) => {
                return new DuckDB(module)
            });
        }
        return g_duckdb;
    }

    /**
     * Unloades the compiled wasm instance.
     */
    static unload() {
        reset();
    }

    /**
     * @returns The DuckDB c++ version
     */
    version(): string {
        return this._exports.version();
    }

    /**
     * @param data Data to encode.
     * @returns string containing the Base 91 encoded data
     */
    encode(data: Uint8Array): string {
        this._exports.reset();

        const unencoded = this.uint8_heapu8(data);
        const encoded = this.malloc_heapu8(unencoded.size + Math.ceil(unencoded.size / 4));

        encoded.size = this._exports.encode(unencoded.ptr, unencoded.size, encoded.ptr);
        let retVal = this.heapu8_string(encoded);
        encoded.size = this._exports.encode_end(encoded.ptr);
        retVal += this.heapu8_string(encoded);

        this.free_heapu8(encoded);
        this.free_heapu8(unencoded);
        return retVal;
    }

    /**
     * 
     * @param duckdbStr encoded string
     * @returns origonal data
     */
    decode(duckdbStr: string): Uint8Array {
        this._exports.reset();

        const encoded = this.string_heapu8(duckdbStr);
        const unencoded = this.malloc_heapu8(encoded.size);

        unencoded.size = this._exports.decode(encoded.ptr, encoded.size, unencoded.ptr);
        let retVal = this.heapu8_uint8(unencoded);
        unencoded.size = this._exports.decode_end(unencoded.ptr);
        retVal = new Uint8Array([...retVal, ...this.heapu8_view(unencoded)]);

        this.free_heapu8(unencoded);
        this.free_heapu8(encoded);
        return retVal;
    }
}
