//  --- POST ---
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array;
}

function initRuntime(asm) {
    runtimeInitialized = true;

    _emscripten_stack_init();
    writeStackCookie();

    asm['__wasm_call_ctors']();

    if (!Module["noFSInit"] && !FS.init.initialized)
        FS.init();
    FS.ignorePermissions = false;

    Module["_malloc"] = asm.malloc;
}

//  --- POST ---
