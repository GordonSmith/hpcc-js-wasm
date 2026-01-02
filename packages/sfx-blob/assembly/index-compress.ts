export { heap_reset, malloc } from "./base91";

import { encode, encode_len } from "./base91";
import { compress as lz4Compress, compress_len as lz4CompressLen } from "./lz4";

let g_compressedLen: usize = 0;

/**
 * Compress a blob using LZ4 compression, then encode with Base91.
 * Returns a pointer to the Base91-encoded string in memory.
 * Use compress_len() to get the length of the output.
 */
export function compress(ptr: usize, len: usize): usize {
    // Step 1: LZ4 compress
    const compressedPtr = lz4Compress(ptr, len);
    const compressedLen = lz4CompressLen();

    // Step 2: Base91 encode
    const encodedPtr = encode(compressedPtr, compressedLen);
    const encodedLen = encode_len();

    g_compressedLen = encodedLen;
    return encodedPtr;
}

/**
 * Get the length of the last compressed output.
 */
export function compress_len(): usize {
    return g_compressedLen;
}
