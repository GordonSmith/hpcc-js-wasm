import { describe, expect, it, vi } from "vitest";

import { WasmLibrary } from "../src/wasm-library.ts";

class TestLib<TModule, TExports> extends WasmLibrary<TModule, TExports> {
    constructor(m: TModule, e: TExports) {
        super(m, e);
    }

    allocAndCopy(bytes: Uint8Array) {
        return this.uint8_heapu8(bytes);
    }

    view(ptr: { ptr: number; size: number }) {
        return this.heapu8_view(ptr);
    }

    copyOut(ptr: { ptr: number; size: number }) {
        return this.heapu8_uint8(ptr);
    }

    free(ptr: { ptr: number; size: number }) {
        this.free_heapu8(ptr);
    }

    strToHeap(s: string) {
        return this.string_heapu8(s);
    }

    heapToStr(ptr: { ptr: number; size: number }) {
        return this.heapu8_string(ptr);
    }
}

describe("WasmLibrary", () => {

    it("uses module _malloc/_free when available", () => {
        const heap = new Uint8Array(64);
        let nextPtr = 0;
        const freeSpy = vi.fn();

        const module = {
            HEAPU8: heap,
            _malloc: (size: number) => {
                const ptr = nextPtr;
                nextPtr += size;
                return ptr;
            },
            _free: (ptr: number) => {
                freeSpy(ptr);
            }
        };

        const lib = new TestLib(module, {});
        const data = new Uint8Array([1, 2, 3, 4]);
        const heapPtr = lib.allocAndCopy(data);

        expect(lib.copyOut(heapPtr)).toEqual(data);
        lib.free(heapPtr);
        expect(freeSpy).toHaveBeenCalledWith(0);
    });

    it("falls back to exports malloc/free when module _malloc/_free missing", () => {
        const heap = new Uint8Array(64);
        let nextPtr = 0;
        const freeSpy = vi.fn();

        const module = {
            HEAPU8: heap
        };

        const exportsObj = {
            malloc: (size: number) => {
                const ptr = nextPtr;
                nextPtr += size;
                return ptr;
            },
            free: (ptr: number) => {
                freeSpy(ptr);
            }
        };

        const lib = new TestLib(module, exportsObj);
        const data = new Uint8Array([9, 8, 7]);
        const heapPtr = lib.allocAndCopy(data);

        expect(lib.view(heapPtr)).toEqual(data);
        lib.free(heapPtr);
        expect(freeSpy).toHaveBeenCalledWith(0);
    });

    it("disposes via exports.delete when present", () => {
        const heap = new Uint8Array(8);
        const deleteSpy = vi.fn();

        const module = { HEAPU8: heap, destroy: vi.fn() };
        const exportsObj = { delete: deleteSpy };

        const lib = new TestLib(module, exportsObj);
        lib.dispose();

        expect(deleteSpy).toHaveBeenCalledTimes(1);
        expect(module.destroy).not.toHaveBeenCalled();
    });

    it("disposes via module.destroy when exports.delete missing", () => {
        const heap = new Uint8Array(8);
        const destroySpy = vi.fn();

        const module = { HEAPU8: heap, destroy: destroySpy };
        const exportsObj = {};

        const lib = new TestLib(module, exportsObj);
        lib.dispose();

        expect(destroySpy).toHaveBeenCalledWith(exportsObj);
    });

    it("string helpers round-trip", () => {
        const heap = new Uint8Array(64);
        let nextPtr = 0;

        const module = {
            HEAPU8: heap,
            _malloc: (size: number) => {
                const ptr = nextPtr;
                nextPtr += size;
                return ptr;
            },
            _free: (_ptr: number) => void 0
        };

        const lib = new TestLib(module, {});
        const heapPtr = lib.strToHeap("abc");
        expect(lib.heapToStr(heapPtr)).toBe("abc");
    });
});
