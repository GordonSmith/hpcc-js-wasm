/**
 * Java bridge for base91 - compiled as standalone WASI WebAssembly.
 *
 * This module exposes a simple C API suitable for use from JVM runtimes
 * (e.g. Endive) via plain linear-memory pointer passing.  It intentionally
 * avoids Emscripten embind so it can be loaded without a JavaScript runtime.
 *
 * Exported functions:
 *   base91_malloc(size)       -> ptr
 *   base91_free(ptr)
 *   base91_encode(in, inLen, out) -> outLen
 *   base91_decode(in, inLen, out) -> outLen
 *   base91_version(out)       -> len  (writes ASCII version string)
 */

#include <base91.hpp>

#include <cstdlib>
#include <cstring>

static const char VERSION[] = "0.6.0";

// One stateless encoder / decoder per module instance - fine for the simple
// use-case where the Java wrapper re-initialises before each operation.
static basE91 g_state;

extern "C"
{

__attribute__((export_name("base91_malloc")))
void* base91_malloc(int size)
{
    return ::malloc(static_cast<std::size_t>(size));
}

__attribute__((export_name("base91_free")))
void base91_free(void* ptr)
{
    ::free(ptr);
}

/**
 * Encode binary data to a base91 ASCII string.
 *
 * @param input     Pointer to raw input bytes (in WASM linear memory).
 * @param input_len Number of input bytes.
 * @param output    Pointer to output buffer.  Caller must allocate at least
 *                  input_len * 2 + 4 bytes.
 * @return Number of bytes written to the output buffer.
 */
__attribute__((export_name("base91_encode")))
int base91_encode(void* input, int input_len, void* output)
{
    basE91_init(&g_state);
    int n = basE91_encode(&g_state, input, input_len, output);
    n += basE91_encode_end(&g_state, static_cast<char*>(output) + n);
    return n;
}

/**
 * Decode a base91 ASCII string to binary data.
 *
 * @param input     Pointer to encoded ASCII bytes (in WASM linear memory).
 * @param input_len Number of encoded bytes.
 * @param output    Pointer to output buffer.  Caller must allocate at least
 *                  input_len bytes.
 * @return Number of bytes written to the output buffer.
 */
__attribute__((export_name("base91_decode")))
int base91_decode(void* input, int input_len, void* output)
{
    basE91_init(&g_state);
    int n = basE91_decode(&g_state, input, input_len, output);
    n += basE91_decode_end(&g_state, static_cast<char*>(output) + n);
    return n;
}

/**
 * Write the library version string into the provided buffer.
 *
 * @param output Pointer to output buffer.  Caller must allocate at least 16 bytes.
 * @return Number of bytes written (not null-terminated).
 */
__attribute__((export_name("base91_version")))
int base91_version(void* output)
{
    int len = static_cast<int>(::strlen(VERSION));
    ::memcpy(output, VERSION, static_cast<std::size_t>(len));
    return len;
}

} // extern "C"
