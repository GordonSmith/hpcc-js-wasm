const read_ = (url: string | URL) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
};

const nodeRead = (url?: string) => {
    var fs = require('fs');
    return fs.readFileSync(url ?? __dirname + '/base91.wasm');
};

const readBinary = (url: string | URL) => {
    //  --- ENVIRONMENT_IS_WORKER  ---
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.responseType = 'arraybuffer';
    xhr.send(null);
    return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
};

const readAsync = (url: string | URL, onload: (arg0: any) => void, onerror: (this: XMLHttpRequest, ev?: ProgressEvent<EventTarget>) => any) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
            return;
        }
        onerror.apply(xhr);
    };
    xhr.onerror = onerror;
    xhr.send(null);
};

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

let g_wasm: Uint8Array | undefined;

export function loadWasm<T extends EmscriptenModule = EmscriptenModule>(wasmLib: (obj: any) => Promise<T>, wf?: string, wasmBinary?: Uint8Array) {
    if (!g_wasm) {
        if (wasmBinary) {
            g_wasm = wasmBinary;
        } else if (wf) {
            g_wasm = nodeRead(__dirname + "/../dist/base91.wasm");
        }
    }
    return wasmLib({
        wasm: g_wasm,
        // locateFile: (path: string, prefix: string) => {
        //     return `${trimEnd(wf || wasmFolder() || prefix || ".", "/")
        //         } /${trimStart(path, "/")}`;
        // }
    });
}
