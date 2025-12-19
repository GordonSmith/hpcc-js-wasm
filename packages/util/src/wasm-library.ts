export type PTR = number;

export interface HeapU8 {
    ptr: PTR;
    size: number;
}

type Destroyable = {
    delete?: () => void;
};

type WasmLibraryModuleLike<U> = {
    _malloc?: (size: number) => PTR;
    _free?: (ptr: PTR) => void;
    destroy?: (instance: U) => void;
    HEAPU8?: Uint8Array;
};

type WasmLibraryExportsLike = {
    malloc?: (size: number) => PTR;
    free?: (ptr: PTR) => void;
};

/**
 * Base class to simplify moving data into and out of Wasm memory.
 *
 * Uses the DuckDB implementation as the baseline, with compatibility fallbacks
 * for older wrappers which expose `malloc/free` on the export object.
 */
export class WasmLibrary<TModule extends object, TExports = undefined> {

    protected _module: TModule & WasmLibraryModuleLike<TExports>;
    protected _exports: TExports;

    protected constructor(_module: TModule, _exports?: TExports) {
        this._module = _module as any;
        this._exports = _exports as any;
    }

    dispose() {
        const exportsAny = this._exports as any as Destroyable;
        if (exportsAny && typeof exportsAny.delete === "function") {
            exportsAny.delete();
            return;
        }
        const moduleAny = this._module as any;
        if (moduleAny && typeof moduleAny.destroy === "function") {
            moduleAny.destroy(this._exports);
        }
    }

    protected malloc_heapu8(size: number): HeapU8 {
        const moduleAny = this._module as any as WasmLibraryModuleLike<TExports>;
        const exportsAny = this._exports as any as WasmLibraryExportsLike;

        const mallocFn =
            moduleAny && typeof moduleAny._malloc === "function" ? moduleAny._malloc.bind(moduleAny)
                : exportsAny && typeof exportsAny.malloc === "function" ? exportsAny.malloc.bind(exportsAny)
                    : undefined;

        if (!mallocFn) {
            throw new Error("WasmLibrary: missing malloc implementation (_malloc or malloc)");
        }

        const ptr: PTR = mallocFn(size) as PTR;
        return { ptr, size };
    }

    protected free_heapu8(data: HeapU8) {
        const moduleAny = this._module as any as WasmLibraryModuleLike<TExports>;
        const exportsAny = this._exports as any as WasmLibraryExportsLike;

        const freeFn =
            moduleAny && typeof moduleAny._free === "function" ? moduleAny._free.bind(moduleAny)
                : exportsAny && typeof exportsAny.free === "function" ? exportsAny.free.bind(exportsAny)
                    : undefined;

        if (!freeFn) {
            throw new Error("WasmLibrary: missing free implementation (_free or free)");
        }

        freeFn(data.ptr);
    }

    protected uint8_heapu8(data: Uint8Array): HeapU8 {
        const retVal = this.malloc_heapu8(data.byteLength);
        const heap = this.heapU8();
        heap.set(data, retVal.ptr);
        return retVal;
    }

    protected heapu8_view(data: HeapU8): Uint8Array {
        const heap = this.heapU8();
        return heap.subarray(data.ptr, data.ptr + data.size);
    }

    protected heapu8_uint8(data: HeapU8): Uint8Array {
        return new Uint8Array([...this.heapu8_view(data)]);
    }

    protected string_heapu8(str: string): HeapU8 {
        const data = Uint8Array.from(str, x => x.charCodeAt(0));
        return this.uint8_heapu8(data);
    }

    protected string_uint8array(str: string): Uint8Array {
        return Uint8Array.from(str, x => x.charCodeAt(0));
    }

    protected heapu8_string(data: HeapU8): string {
        const retVal = Array.from({ length: data.size });
        const submodule = this.heapu8_view(data);
        submodule.forEach((c: number, i: number) => {
            retVal[i] = String.fromCharCode(c);
        });
        return retVal.join("");
    }

    private heapU8(): Uint8Array {
        const moduleAny = this._module as any as WasmLibraryModuleLike<TExports>;
        if (!moduleAny || !(moduleAny.HEAPU8 instanceof Uint8Array)) {
            throw new Error("WasmLibrary: missing HEAPU8");
        }
        return moduleAny.HEAPU8;
    }
}
