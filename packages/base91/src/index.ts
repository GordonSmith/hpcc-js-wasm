// @ts-ignore
import base91Module from "../../../build/packages/base91/base91";
import { loadWasm } from "./util";

interface hpccjs extends EmscriptenModule {
    encode2(data: number, size: number): string;
    decode2(str: string, strSize: number, data: number, size: number): void;
}

interface Base91Module extends EmscriptenModule {
    hpccjs: hpccjs;
    // uint8ArrayToVector(data: Uint8Array): any;
    // uint8VectorToArray(data: any): number[];
    // encode(data: any): string;
    // decode(data: string): any;
    // stream_encode(data: any): string;
    // stream_decode(data: string): any;
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

// export async function encode(data: Uint8Array, wasmFolder?: string, wasmBinary?: Uint8Array) {
//     const module = await load(wasmFolder, wasmBinary);
//     return module.encode(module.uint8ArrayToVector(data));
// }

// export async function decode(b91str: string, wasmFolder?: string, wasmBinary?: Uint8Array) {
//     const module = await load(wasmFolder, wasmBinary);
//     return module.uint8VectorToArray(module.decode(b91str));
// }

// export async function stream_encode(data: Uint8Array, wasmFolder?: string, wasmBinary?: Uint8Array) {
//     const module = await load(wasmFolder, wasmBinary);
//     return module.stream_encode(module.uint8ArrayToVector(data));
// }

// export async function stream_decode(b91str: string, wasmFolder?: string, wasmBinary?: Uint8Array) {
//     const module = await load(wasmFolder, wasmBinary);
//     return module.uint8VectorToArray(module.stream_decode(b91str));
// }
