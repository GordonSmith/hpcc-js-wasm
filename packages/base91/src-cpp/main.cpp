#include <string>
#include <base91.hpp>

#include <emscripten/bind.h>
#include <emscripten/val.h>

using namespace emscripten;

const char *const version = "0.6.0";

class WasmMemory
{
public:
    size_t size;
    void *ptr;

    WasmMemory(void *ptr, size_t size) : ptr(ptr), size(size)
    {
    }

    WasmMemory(size_t size) : size(size)
    {
        ptr = malloc(size);
    }

    ~WasmMemory()
    {
        free(ptr);
    }

    val get()
    {
        return val(typed_memory_view(size, static_cast<uint8_t *>(ptr)));
    }
};

class CBase91
{
protected:
    basE91 m_basE91;

public:
    CBase91()
    {
        reset();
    }

    val version()
    {
        return val(::version);
    }

    void reset()
    {
        basE91_init(&m_basE91);
    }

    WasmMemory *encode(const WasmMemory *mem)
    {
        char *dataOut;
        size_t dataOutLen = basE91_encode(&m_basE91, mem->ptr, mem->size, dataOut);
        return new WasmMemory(dataOut, dataOutLen);
    }

    WasmMemory *encode_end(const WasmMemory *mem)
    {
        char *dataOut;
        size_t dataOutLen = basE91_encode_end(&m_basE91, dataOut);
        return new WasmMemory(dataOut, dataOutLen);
    }

    WasmMemory *decode(const WasmMemory *mem)
    {
        char *dataOut;
        size_t dataOutLen = basE91_decode(&m_basE91, mem->ptr, mem->size, dataOut);
        return new WasmMemory(dataOut, dataOutLen);
    }

    WasmMemory *decode_end(const WasmMemory *mem)
    {
        char *dataOut;
        size_t dataOutLen = basE91_decode_end(&m_basE91, dataOut);
        return new WasmMemory(dataOut, dataOutLen);
    }
};

//  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---

EMSCRIPTEN_BINDINGS(base91_class)
{
    class_<WasmMemory>("WasmMemory")
        .constructor<size_t>()
        .function("get", &WasmMemory::get);

    class_<CBase91>("CBase91")
        .function("version", &CBase91::version)
        .function("reset", &CBase91::reset)
        .function("encode", &CBase91::encode, return_value_policy::take_ownership())
        .function("encode_end", &CBase91::encode_end, return_value_policy::take_ownership())
        .function("decode", &CBase91::decode, return_value_policy::take_ownership())
        .function("decode_end", &CBase91::decode_end, return_value_policy::take_ownership());
}
