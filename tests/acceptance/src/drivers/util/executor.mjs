function createModule() {
    const HEAPU8 = new Uint8Array(4096);
    const freed = [];
    let nextPtr = 8;
    return {
        HEAPU8,
        freed,
        _malloc(size) {
            const ptr = nextPtr;
            nextPtr += Math.max(size, 1);
            return ptr;
        },
        _free(ptr) {
            freed.push(ptr);
        },
        lengthBytesUTF8(value) {
            return new TextEncoder().encode(value).byteLength;
        },
        stringToUTF8(value, ptr, maxBytes) {
            const bytes = new TextEncoder().encode(value).subarray(0, maxBytes - 1);
            HEAPU8.set(bytes, ptr);
            HEAPU8[ptr + bytes.length] = 0;
        },
        UTF8ToString(ptr, maxBytes) {
            let end = ptr;
            const limit = ptr + maxBytes;
            while (end < limit && HEAPU8[end] !== 0) ++end;
            return new TextDecoder().decode(HEAPU8.subarray(ptr, end));
        }
    };
}

const operations = {
    async heap({ MainModuleEx }) {
        const module = createModule();
        const util = new MainModuleEx(module);

        const allocation = util.malloc(10);
        const mallocSize = allocation.size;
        const mallocPointerPositive = allocation.ptr > 0;
        util.free(allocation);
        const mallocFreed = module.freed.includes(allocation.ptr);

        const disposable = util.malloc(4);
        const disposablePtr = disposable.ptr;
        disposable.dispose();
        const disposeFreed = module.freed.includes(disposablePtr);

        const bytes = util.dataToHeap(Uint8Array.from([1, 2, 3, 4]));
        const copy = util.heapToUint8Array(bytes);
        util.heapView(bytes)[0] = 9;
        const heapByteAfterMutation = module.HEAPU8[bytes.ptr];
        const copiedBytesAfterMutation = Array.from(copy);
        util.free(bytes);

        const empty = util.dataToHeap(new Uint8Array());
        const emptyAllocationSize = empty.size;
        const emptyViewLength = util.heapView(empty).length;
        util.free(empty);

        return {
            mallocSize,
            mallocPointerPositive,
            mallocFreed,
            disposeFreed,
            heapByteAfterMutation,
            copiedBytesAfterMutation,
            emptyAllocationSize,
            emptyViewLength
        };
    },

    async string({ MainModuleEx }, { value }) {
        const module = createModule();
        const util = new MainModuleEx(module);
        const byteLength = util.lengthBytes(value);
        const data = util.stringToHeap(value);
        const allocationSize = data.size;
        const trailingNull = module.HEAPU8[data.ptr + data.size - 1];
        const roundTrip = util.heapToString(data);
        const ptr = data.ptr;
        data.dispose();
        return {
            byteLength,
            allocationSize,
            trailingNull,
            roundTrip,
            freed: module.freed.includes(ptr)
        };
    },

    async filesystem({ MainModuleEx }) {
        const absent = new MainModuleEx(createModule());
        const incompleteModule = {
            ...createModule(),
            FS_createPath() { },
            FS_createDataFile() { },
            FS_preloadFile() { return Promise.resolve(); }
        };
        const incomplete = new MainModuleEx(incompleteModule);

        const calls = {};
        const fullModule = {
            ...createModule(),
            FS_createPath(...args) { calls.createPathArgs = args; },
            FS_createDataFile(...args) { calls.createDataFileArgs = args; },
            FS_preloadFile(...args) { calls.preloadFileArgs = args; return Promise.resolve(); },
            FS_unlink(path) { calls.unlinkPath = path; }
        };
        const util = new MainModuleEx(fullModule);
        const bytes = Uint8Array.from([8, 9]);
        util.createPath("assets");
        util.createDataFile("assets/file.bin", bytes);
        await util.preloadFile("assets/preload.bin", bytes);
        util.unlink("assets/file.bin");
        return {
            absentDetected: absent.hasFilesystem(),
            incompleteDetected: incomplete.hasFilesystem(),
            completeDetected: util.hasFilesystem(),
            createPathArgs: calls.createPathArgs,
            createDataFileArgs: [calls.createDataFileArgs[0], calls.createDataFileArgs[1], Array.from(calls.createDataFileArgs[2]), ...calls.createDataFileArgs.slice(3)],
            preloadFileArgs: [calls.preloadFileArgs[0], calls.preloadFileArgs[1], Array.from(calls.preloadFileArgs[2]), ...calls.preloadFileArgs.slice(3)],
            unlinkPath: calls.unlinkPath
        };
    },

    async exports(utility) {
        return {
            globalsAbsent: ["navigator", "window", "document", "Worker", "XMLHttpRequest", "fetch", "Blob", "SharedArrayBuffer"]
                .every(name => typeof globalThis[name] === "undefined"),
            mainModuleExType: typeof utility.MainModuleEx
        };
    }
};

export async function execute(utility, op, args) {
    try {
        return { ok: true, value: await operations[op](utility, args) };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
}
