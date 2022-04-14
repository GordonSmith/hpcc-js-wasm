// @ts-ignore
import zliblib from "../build/zlib/zlib";
import { loadWasm } from "./util";

interface IBuffer {
    length(): number;
}

interface IZlib {
    version(): string;
    compressString(str: string): IBuffer;
    decompressString(buff: IBuffer): string;
}

interface ZlibModule extends EmscriptenModule {
    Zlib: any;
}

let g_zlib: Promise<IZlib>;
async function zlib(wasmFolder?: string, wasmBinary?: Uint8Array) {
    if (!g_zlib) {
        g_zlib = loadWasm<ZlibModule>(zliblib, wasmFolder, wasmBinary).then(module => {
            return module.Zlib.prototype as IZlib;
        });

    }
    return g_zlib;
}

export function version(wasmFolder?: string, wasmBinary?: Uint8Array) {
    return zlib(wasmFolder, wasmBinary).then(zlib => {
        return zlib.version();
    });
}

export function compress(str: string, wasmFolder?: string, wasmBinary?: Uint8Array) {
    return zlib(wasmFolder, wasmBinary).then(zlib => {
        return zlib.compressString(str);
    });
}

export function decompress(buff: IBuffer, wasmFolder?: string, wasmBinary?: Uint8Array) {
    return zlib(wasmFolder, wasmBinary).then(zlib => {
        return zlib.decompressString(buff);
    });
}
