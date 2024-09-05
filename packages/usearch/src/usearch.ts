// @ts-expect-error importing from a wasm file is resolved via a custom esbuild plugin
import load, { reset } from "../build/usearchlib.wasm";
import type { CUSearch, MainModule, MetricKind, MetricKindValue, ScalarKind, VectorF32 } from "../build/usearchlib.wasm.d.ts";

//  Ref:  http://USearch.sourceforge.net/#a5

/**
 * Base 91 WASM library, similar to Base 64 but uses more characters resulting in smaller strings.
 * 
 * See [USearch](https://USearch.sourceforge.net/) for more details.
 *
 * ```ts
 * import { USearch } from "@hpcc-js/wasm-USearch";
 * 
 * const USearch = await USearch.load();
 * 
 * const encoded_data = await USearch.encode(data);
 * const decoded_data = await USearch.decode(encoded_data);
 * ```
 */
export interface USearchOptions {
    metric: MetricKind;
    quantization: ScalarKind;
    connectivity: number;
    expansion_add: number;
    expansion_search: number;
    multi: boolean;
}

let g_usearchWasm: Promise<USearchWasm>;

export class USearchWasm {

    protected _module: MainModule;

    private constructor(_module: MainModule) {
        this._module = _module;
    }

    /**
     * Compiles and instantiates the raw wasm.
     * 
     * ::: info
     * In general WebAssembly compilation is disallowed on the main thread if the buffer size is larger than 4KB, hence forcing `load` to be asynchronous;
     * :::
     * 
     * @returns A promise to an instance of the USearch class.
     */
    static load(): Promise<USearchWasm> {
        if (!g_usearchWasm) {
            g_usearchWasm = load().then((module: any) => {
                return new USearchWasm(module)
            });
        }
        return g_usearchWasm;
    }

    /**
     * Unloades the compiled wasm instance.
     */
    static unload() {
        reset();
    }

    /**
     * @returns The USearch c++ version
     */
    version(): string {
        return this._module.version();
    }

    get MetricKind() {
        return this._module.MetricKind;
    }

    get ScalarKind() {
        return this._module.ScalarKind;
    }

    get VectorF32() {
        return this._module.VectorF32;
    }

    create(dimensions: number, metric: MetricKind = this.MetricKind.cos, quantization: ScalarKind = this.ScalarKind.f32, connectivity: number = 0, expansion_add: number = 0, expansion_search: number = 0, multi: boolean = false): CUSearch {
        return new this._module.CUSearch(dimensions, metric, quantization, connectivity, expansion_add, expansion_search, multi);
    }

    // /**
    //  * @param data Data to encode.
    //  * @returns string containing the Base 91 encoded data
    //  */
    // encode(data: Uint8Array): string {
    //     this._exports.reset();

    //     const unencoded = this.uint8_heapu8(data);
    //     const encoded = this.malloc_heapu8(unencoded.size + Math.ceil(unencoded.size / 4));

    //     encoded.size = this._exports.encode(unencoded.ptr, unencoded.size, encoded.ptr);
    //     let retVal = this.heapu8_string(encoded);
    //     encoded.size = this._exports.encode_end(encoded.ptr);
    //     retVal += this.heapu8_string(encoded);

    //     this.free_heapu8(encoded);
    //     this.free_heapu8(unencoded);
    //     return retVal;
    // }

    // /**
    //  * 
    //  * @param usearchStr encoded string
    //  * @returns origonal data
    //  */
    // decode(usearchStr: string): Uint8Array {
    //     this._exports.reset();

    //     const encoded = this.string_heapu8(usearchStr);
    //     const unencoded = this.malloc_heapu8(encoded.size);

    //     unencoded.size = this._exports.decode(encoded.ptr, encoded.size, unencoded.ptr);
    //     let retVal = this.heapu8_uint8(unencoded);
    //     unencoded.size = this._exports.decode_end(unencoded.ptr);
    //     retVal = new Uint8Array([...retVal, ...this.heapu8_view(unencoded)]);

    //     this.free_heapu8(unencoded);
    //     this.free_heapu8(encoded);
    //     return retVal;
    // }
}
