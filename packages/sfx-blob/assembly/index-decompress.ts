// Decompress-only entry point
export { heap_reset, malloc } from "./base91";

import { decode, decode_len } from "./base91";
import { decompress as lz4Decompress, decompress_len as lz4DecompressLen } from "./lz4";

let g_decompressedLen: usize = 0;

/**
 * Decompress a Base91-encoded string by first decoding Base91, then decompressing with LZ4.
 * Returns a pointer to the decompressed data in memory.
 * Use decompress_len() to get the length of the output.
 */
export function decompress(ptr: usize, len: usize): usize {
    // Step 1: Base91 decode
    const decodedPtr = decode(ptr, len);
    const decodedLen = decode_len();

    // Step 2: LZ4 decompress
    const decompressedPtr = lz4Decompress(decodedPtr, decodedLen);
    const decompressedLen = lz4DecompressLen();

    g_decompressedLen = decompressedLen;
    return decompressedPtr;
}

/**
 * Get the length of the last decompressed output.
 */
export function decompress_len(): usize {
    return g_decompressedLen;
}
