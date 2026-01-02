import load, { reset } from "./loader.ts";

type MainModule = Awaited<ReturnType<typeof load>>;

let g_base91Asm: Promise<Base91Asm>;

export class Base91Asm {

    private readonly _mainModule: MainModule;
    private readonly _encoder = new TextEncoder();
    private readonly _decoder = new TextDecoder("utf-8");

    private constructor(_module: MainModule) {
        this._mainModule = _module;
    }

    static load(): Promise<Base91Asm> {
        if (!g_base91Asm) {
            g_base91Asm = (async () => {
                const module = await load({
                    env: {
                        abort: (_msgPtr: number, _filePtr: number, line: number, col: number) => {
                            throw new Error(`AssemblyScript abort at ${line}:${col}`);
                        }
                    }
                });
                return new Base91Asm(module);
            })();
        }
        return g_base91Asm;
    }

    static unload() {
        reset();
        g_base91Asm = undefined as unknown as Promise<Base91Asm>;
    }

    version(): string {
        return "0.6.0";
    }

    reset(): void {
        this._mainModule.heap_reset();
    }

    encode(data: Uint8Array): string {
        this._mainModule.heap_reset();

        const ptr = this._mainModule.malloc(data.byteLength);
        new Uint8Array(this._mainModule.memory.buffer, ptr, data.byteLength).set(data);

        const outPtr = this._mainModule.encode(ptr, data.byteLength);
        const outLen = this._mainModule.encode_len();
        const outBytes = new Uint8Array(this._mainModule.memory.buffer, outPtr, outLen);

        const ret = this._decoder.decode(outBytes);
        this._mainModule.heap_reset();
        return ret;
    }

    decode(base91Str: string): Uint8Array {
        this._mainModule.heap_reset();

        const encoded = this._encoder.encode(base91Str);
        const ptr = this._mainModule.malloc(encoded.byteLength);
        new Uint8Array(this._mainModule.memory.buffer, ptr, encoded.byteLength).set(encoded);

        const outPtr = this._mainModule.decode(ptr, encoded.byteLength);
        const outLen = this._mainModule.decode_len();
        const outBytes = new Uint8Array(this._mainModule.memory.buffer, outPtr, outLen);

        const ret = new Uint8Array(outBytes);
        this._mainModule.heap_reset();
        return ret;
    }

    // Chunked encoding/decoding support
    private _encodeState = { b: 0, n: 0 };
    private _decodeState = { b: 0, n: 0, v: -1 };

    encodeChunk(data: Uint8Array): string {
        const ptr = this._mainModule.malloc(data.byteLength);
        new Uint8Array(this._mainModule.memory.buffer, ptr, data.byteLength).set(data);

        const outPtr = this._mainModule.encode(ptr, data.byteLength);
        const outLen = this._mainModule.encode_len();
        const outBytes = new Uint8Array(this._mainModule.memory.buffer, outPtr, outLen);

        return this._decoder.decode(outBytes);
    }

    encodeChunkEnd(): string {
        // Return any remaining buffered data
        return "";
    }

    decodeChunk(base91Str: string): Uint8Array {
        const encoded = this._encoder.encode(base91Str);
        const ptr = this._mainModule.malloc(encoded.byteLength);
        new Uint8Array(this._mainModule.memory.buffer, ptr, encoded.byteLength).set(encoded);

        const outPtr = this._mainModule.decode(ptr, encoded.byteLength);
        const outLen = this._mainModule.decode_len();
        const outBytes = new Uint8Array(this._mainModule.memory.buffer, outPtr, outLen);

        return new Uint8Array(outBytes);
    }

    decodeChunkEnd(): Uint8Array {
        // Return any remaining buffered data
        return new Uint8Array(0);
    }
}
