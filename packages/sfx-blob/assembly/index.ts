// Re-export base91 and lz4 functions for backward compatibility
export { heap_reset, malloc, encode_len, decode_len, encode, decode } from "./base91";
export { compress_len as lz4_compress_len, decompress_len as lz4_decompress_len, compress as lz4_compress, decompress as lz4_decompress } from "./lz4";

import { encode as base91Encode, decode as base91Decode, encode_len as base91EncodeLen, decode_len as base91DecodeLen } from "./base91";
import { compress as lz4Compress, decompress as lz4Decompress, compress_len as lz4CompressLen, decompress_len as lz4DecompressLen } from "./lz4";

let g_compressedLen: usize = 0;
let g_decompressedLen: usize = 0;

/**
 * Compress a blob using LZ4 compression, then encode with Base91.
 * Returns a pointer to the Base91-encoded string in memory.
 * Use sfx_compress_len() to get the length of the output.
 */
export function sfx_compress(ptr: usize, len: usize): usize {
    // Step 1: LZ4 compress
    const compressedPtr = lz4Compress(ptr, len);
    const compressedLen = lz4CompressLen();

    // Step 2: Base91 encode
    const encodedPtr = base91Encode(compressedPtr, compressedLen);
    const encodedLen = base91EncodeLen();

    g_compressedLen = encodedLen;
    return encodedPtr;
}

/**
 * Get the length of the last compressed output.
 */
export function sfx_compress_len(): usize {
    return g_compressedLen;
}

/**
 * Decompress a Base91-encoded string by first decoding Base91, then decompressing with LZ4.
 * Returns a pointer to the decompressed data in memory.
 * Use sfx_decompress_len() to get the length of the output.
 */
export function sfx_decompress(ptr: usize, len: usize): usize {
    // Step 1: Base91 decode
    const decodedPtr = base91Decode(ptr, len);
    const decodedLen = base91DecodeLen();

    // Step 2: LZ4 decompress
    const decompressedPtr = lz4Decompress(decodedPtr, decodedLen);
    const decompressedLen = lz4DecompressLen();

    g_decompressedLen = decompressedLen;
    return decompressedPtr;
}

/**
 * Get the length of the last decompressed output.
 */
export function sfx_decompress_len(): usize {
    return g_decompressedLen;
}
