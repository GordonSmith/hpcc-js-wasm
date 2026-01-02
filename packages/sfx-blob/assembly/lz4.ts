// Minimal LZ4 block compressor/decompressor (no frame format).
//
// Wire format used here:
// - output = [u32 little-endian originalLength] + [LZ4 block payload]
// This allows `decompress()` to allocate the correct output size without an outLen parameter.

import { malloc } from "./base91";

let g_lastLen: usize = 0;

export function compress_len(): usize {
    return g_lastLen;
}

export function decompress_len(): usize {
    return g_lastLen;
}

@inline
function readU16LE(ptr: usize): u16 {
    return <u16>(load<u8>(ptr) | (load<u8>(ptr + 1) << 8));
}

@inline
function writeU32LE(ptr: usize, v: u32): void {
    store<u32>(ptr, v);
}

@inline
function readU32LE(ptr: usize): u32 {
    return load<u32>(ptr);
}

@inline
function compressBound(len: usize): usize {
    return len + (len >>> 8) + 16;
}

@inline
function addLen(outPtr: usize, outIdx: usize, len: u32): usize {
    while (len >= 255) {
        store<u8>(outPtr + outIdx++, 255);
        len -= 255;
    }
    store<u8>(outPtr + outIdx++, <u8>len);
    return outIdx;
}

export function compress(ptr: usize, len: usize): usize {
    const outPtr = malloc(4 + compressBound(len));
    store<u32>(outPtr, <u32>len);

    let outIdx: usize = 4;
    const litLen = <u32>len;
    store<u8>(outPtr + outIdx++, <u8>(min<u32>(litLen, 15) << 4));
    if (litLen >= 15) outIdx = addLen(outPtr, outIdx, litLen - 15);

    memory.copy(outPtr + outIdx, ptr, len);
    outIdx += len;

    g_lastLen = outIdx;
    return outPtr;
}

export function decompress(ptr: usize, len: usize): usize {
    if (len < 4) {
        g_lastLen = 0;
        return 0;
    }

    const outLen = <usize>readU32LE(ptr);
    const outPtr = malloc(outLen);

    let ip: usize = ptr + 4;
    const inEnd: usize = ptr + len;

    let op: usize = outPtr;
    const outEnd: usize = outPtr + outLen;

    while (ip < inEnd) {
        const token = load<u8>(ip++);

        // Literals
        let litLen: u32 = <u32>(token >>> 4);
        if (litLen == 15) {
            let s: u8;
            do {
                if (ip >= inEnd) break;
                s = load<u8>(ip++);
                litLen += <u32>s;
            } while (s == 255);
        }

        // Copy literals
        for (let i: u32 = 0; i < litLen; i++) {
            if (ip >= inEnd || op >= outEnd) break;
            store<u8>(op++, load<u8>(ip++));
        }

        if (ip >= inEnd) break;

        // Match offset
        if (ip + 2 > inEnd) break;
        const offset = <usize>readU16LE(ip);
        ip += 2;
        if (offset == 0 || offset > (op - outPtr)) {
            // Invalid stream; stop.
            break;
        }

        // Match length
        let matchLen: u32 = <u32>(token & 0x0f);
        if (matchLen == 15) {
            let s: u8;
            do {
                if (ip >= inEnd) break;
                s = load<u8>(ip++);
                matchLen += <u32>s;
            } while (s == 255);
        }
        matchLen += 4;

        // Copy match (may overlap)
        let matchPtr: usize = op - offset;
        for (let i: u32 = 0; i < matchLen; i++) {
            if (op >= outEnd) break;
            store<u8>(op++, load<u8>(matchPtr++));
        }
    }

    g_lastLen = <usize>(op - outPtr);
    return outPtr;
}
