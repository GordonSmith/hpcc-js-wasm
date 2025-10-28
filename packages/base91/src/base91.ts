import { resources } from "../../../build/packages/base91/base91lib.component.js";

//  Ref:  http://base91.sourceforge.net/#a5

let g_base91: Base91 | undefined;

/**
 * Base 91 WASM library, similar to Base 64 but uses more characters resulting in smaller strings.
 * 
 * See [Base91](https://base91.sourceforge.net/) for more details.
 *
 * ```ts
 * import { Base91 } from "@hpcc-js/wasm-base91";
 * 
 * const base91 = await Base91.load();
 * 
 * const encoded_data = base91.encode(data);
 * const decoded_data = base91.decode(encoded_data);
 * ```
 */
export class Base91 {

    private _instance: resources.Base91;

    private constructor() {
        this._instance = new resources.Base91();
    }

    /**
     * Loads the WASM component.
     * 
     * ::: info
     * The component is loaded asynchronously to allow for large WASM files.
     * :::
     * 
     * @returns An instance of the Base91 class.
     */
    static async load(): Promise<Base91> {
        if (!g_base91) {
            // Wait a tick to ensure the component module is fully loaded
            await new Promise(resolve => setTimeout(resolve, 0));
            g_base91 = new Base91();
        }
        return g_base91;
    }

    /**
     * Unloads the compiled wasm instance.
     */
    static unload() {
        g_base91 = undefined;
    }

    /**
     * @returns The Base91 c++ version
     */
    version(): string {
        return this._instance.version();
    }

    /**
     * @param data Data to encode.
     * @returns string containing the Base 91 encoded data
     */
    encode(data: Uint8Array): string {
        this._instance.reset();
        const encoded = this._instance.encode(data);
        const encodedEnd = this._instance.encodeEnd();
        return encoded + encodedEnd;
    }

    /**
     * 
     * @param base91Str encoded string
     * @returns original data
     */
    decode(base91Str: string): Uint8Array {
        this._instance.reset();
        const decoded = this._instance.decode(base91Str);
        const decodedEnd = this._instance.decodeEnd();

        // Combine decoded data with any remaining bytes from decodeEnd
        if (decodedEnd.length === 0) {
            return decoded;
        }

        const result = new Uint8Array(decoded.length + decodedEnd.length);
        result.set(decoded, 0);
        // Convert string to bytes
        const endBytes = new TextEncoder().encode(decodedEnd);
        result.set(endBytes, decoded.length);
        return result;
    }
}
