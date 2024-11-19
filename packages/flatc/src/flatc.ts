// @ts-expect-error importing from a wasm file is resolved via a custom esbuild plugin
import load, { reset } from "../../../build/packages/flatc/src-cpp/flatclib.wasm";
import type { MainModule } from "../../../build/packages/flatc/src-cpp/flatclib.js";

//  Ref:  http://facebook.github.io/flatbuffers/flatbuffers_manual.html
//  Ref:  https://github.com/facebook/flatbuffers

/**
 * The Zstandard WASM library, provides a simplified wrapper around the Zstandard c++ library.
 * 
 * See [Zstandard](https://facebook.github.io/flatbuffers/) for more details.
 * 
 * ```ts
 * import { Flatbuffers } from "@hpcc-js/wasm-flatbuffers";
 * 
 * const flatbuffers = await Flatbuffers.load();
 * 
 * //  Generate some "data"
 * const data = new Uint8Array(Array.from({ length: 100000 }, (_, i) => i % 256));
 * 
 * const compressed_data = flatbuffers.compress(data);
 * const decompressed_data = flatbuffers.decompress(compressed_data);
 * ```
 */
export class FlatC {

    private constructor(public _module: MainModule) {
    }

    /**
     * Compiles and instantiates the raw wasm.
     * 
     * ::: info
     * In general WebAssembly compilation is disallowed on the main thread if the buffer size is larger than 4KB, hence forcing `load` to be asynchronous;
     * :::
     * 
     * @returns A promise to an instance of the Flatbuffers class.
     */
    static load(): Promise<FlatC> {
        return load().then((module: any) => {
            return new FlatC(module)
        });
    }

    /**
     * Unloades the compiled wasm instance.
     */
    static unload() {
        reset();
    }

    main(_args: string[]): [number, string[]] {
        const args = new this._module.VectorString();
        _args.forEach(arg => {
            args.push_back(arg);
        });
        const retVal = new this._module.VectorString();
        let int = 0;
        const _retVal: string[] = [];
        try {
            int = this._module.main(args, retVal);
            for (let i = 0; i < retVal.size(); ++i) {
                _retVal.push(retVal.get(i)?.toString() ?? "");
            }
        } catch (e: any) {
            console.error(e);
            int = e?.status ?? -1;
        } finally {
            args.delete();
            retVal.delete();
        }
        return [int, _retVal];
    }


    /**
     * @returns The Flatbuffers c++ version
     */
    version(): string {
        return this._module.version();
    }
}
