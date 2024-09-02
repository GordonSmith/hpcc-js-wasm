#include <vector>
#include <string>
#include <base91.hpp>

// #include <emscripten/bind.h>
// #include <emscripten/val.h>

// using namespace emscripten;

const char *const version = "0.6.0";

// class WasmMemory
// {
// public:
//     size_t size;
//     void *ptr;

//     WasmMemory(size_t size) : size(size)
//     {
//         ptr = malloc(size);
//     }

//     ~WasmMemory()
//     {
//         free(ptr);
//     }

//     val get()
//     {
//         return val(typed_memory_view(size, static_cast<uint8_t *>(ptr)));
//     }
// };

// class CBase91
// {
// protected:
//     basE91 m_basE91;

// public:
//     CBase91()
//     {
//         reset();
//     }

//     static void *malloc(size_t __size)
//     {
//         return ::malloc(__size);
//     }

//     static void free(void *__ptr)
//     {
//         ::free(__ptr);
//     }

//     val version()
//     {
//         return val(::version);
//     }

//     void reset()
//     {
//         basE91_init(&m_basE91);
//     }

//     val encode(const std::string &array)
//     {
//         char *buffer;
//         size_t bufferLength = basE91_encode(&m_basE91, array.data(), array.size(), buffer);
//         return val(typed_memory_view(bufferLength, buffer));
//     }

//     val encode_end()
//     {
//         char *buffer;
//         size_t bufferLength = basE91_encode_end(&m_basE91, buffer);
//         return val(typed_memory_view(bufferLength, buffer));
//     }

//     val decode(const std::string &str)
//     {
//         char *dataOut;
//         size_t dataOutLen = basE91_decode(&m_basE91, str.c_str(), str.length(), dataOut);
//         return val(typed_memory_view(dataOutLen, (const char *)dataOut));
//     }

//     val decode_end()
//     {
//         char *dataOut;
//         size_t dataOutLen = basE91_decode_end(&m_basE91, dataOut);
//         return val(typed_memory_view(dataOutLen, dataOut));
//     }
// };

class CBasE91
{
protected:
    basE91 m_basE91;

public:
    CBasE91()
    {
        reset();
    }

    static void *malloc(size_t __size)
    {
        return ::malloc(__size);
    }

    static void free(void *__ptr)
    {
        ::free(__ptr);
    }

    const char *version()
    {
        return ::version;
    }

    void reset()
    {
        basE91_init(&m_basE91);
    }

    size_t encode(const void *data, size_t dataLen, void *dataOut)
    {
        return basE91_encode(&m_basE91, data, dataLen, dataOut);
    }

    size_t encode_end(void *dataOut)
    {
        return basE91_encode_end(&m_basE91, dataOut);
    }

    size_t decode(const void *data, size_t dataLen, void *dataOut)
    {
        return basE91_decode(&m_basE91, data, dataLen, dataOut);
    }

    size_t decode_end(void *dataOut)
    {
        return basE91_decode_end(&m_basE91, dataOut);
    }
};

//  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---

// EMSCRIPTEN_BINDINGS(base91_class)
// {
//     register_vector<uint8_t>("UInt8Vector");
//     // class_<WasmMemory>("WasmMemory")
//     //     .constructor<size_t>()
//     //     .function("get", &WasmMemory::get);

//     class_<CBase91>("CBase91")
//         .constructor<>()
//         .function("version", &CBase91::version)
//         .function("reset", &CBase91::reset)
//         .function("encode", &CBase91::encode)
//         //     .function("encode_end", &CBase91::encode_end, return_value_policy::take_ownership())
//         //     .function("decode", &CBase91::decode, return_value_policy::take_ownership())
//         //     .function("decode_end", &CBase91::decode_end, return_value_policy::take_ownership());
//         ;
// }

//  Include JS Glue  ---
#include "main_glue.cpp"
