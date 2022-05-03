// @ts-ignore
import base91Module from "../../../build/packages/base91/base91";
import { loadWasm } from "./util";

interface Base91Module extends EmscriptenModule {
    uint8ArrayToVector(data: Uint8Array): any;
    uint8VectorToArray(data: any): number[];
    encode(data: any): string;
    decode(data: string): any;
}

let g_base91: Promise<Base91Module>;
export async function load(wasmFolder?: string, wasmBinary?: Uint8Array) {
    if (!g_base91) {
        g_base91 = loadWasm<Base91Module>(base91Module, wasmFolder, wasmBinary).then(module => {
            return module as Base91Module;
        });
    }
    return g_base91;
}

export async function encode(data: Uint8Array, wasmFolder?: string, wasmBinary?: Uint8Array) {
    const module = await load(wasmFolder, wasmBinary);
    return module.encode(module.uint8ArrayToVector(data));
}

export async function decode(b91str: string, wasmFolder?: string, wasmBinary?: Uint8Array) {
    const module = await load(wasmFolder, wasmBinary);
    return module.uint8VectorToArray(module.decode(b91str));
}

