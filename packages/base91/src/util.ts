// function getGlobal() {
//     if (typeof self !== "undefined") { return self; }
//     if (typeof window !== "undefined") { return window; }
//     if (typeof global !== "undefined") { return global; }
//     throw new Error("unable to locate global object");
// }

const globalNS: any = globalThis;

let _wasmFolder: string | undefined = globalNS.__hpcc_wasmFolder || undefined;
export function wasmFolder(_?: string): string | undefined {
    if (!arguments.length) return _wasmFolder;
    const retVal: string | undefined = _wasmFolder;
    _wasmFolder = _;
    return retVal;
}

function trimEnd(str: string, charToRemove: string) {
    while (str.charAt(str.length - 1) === charToRemove) {
        str = str.substring(0, str.length - 1);
    }
    return str;
}

function trimStart(str: string, charToRemove: string) {
    while (str.charAt(0) === charToRemove) {
        str = str.substring(1);
    }
    return str;
}

export function loadWasm<T extends EmscriptenModule = EmscriptenModule>(wasmLib: (obj: any) => Promise<T>, wf?: string, wasmBinary?: Uint8Array) {
    return wasmLib({
        wasmBinary,
        locateFile: (path: string, prefix: string) => {
            return `${trimEnd(wf || wasmFolder() || prefix || ".", "/")}/${trimStart(path, "/")}`;
        }
    });
}
