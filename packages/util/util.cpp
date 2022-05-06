#include "util.hpp"
#include <emscripten.h>

Buffer::Buffer()
{
}

Buffer::Buffer(const std::vector<unsigned char> &compressed_data) : m_compressed_data(compressed_data)
{
}

Buffer::Buffer(const Buffer &b)
{
    m_compressed_data = b.m_compressed_data;
}

Buffer::~Buffer()
{
}

void *Buffer::data() const
{
    return (void *)&m_compressed_data[0];
}

std::size_t Buffer::length() const
{
    return m_compressed_data.size();
}

std::vector<uint8_t> uint8ArrayToVector(const emscripten::val &v)
{
    return jsArrayToVector<uint8_t>(v);
}

emscripten::val uint8VectorToArray(const std::vector<uint8_t> &v)
{
    return vectorToJSArray(v);
}

vectorbuf::vectorbuf(const std::vector<uint8_t> &v)
{
    setg((char *)v.data(), (char *)v.data(), (char *)(v.data() + v.size()));
}

vectorbuf::~vectorbuf()
{
}

EM_JS(void, console_log, (const char *msg), {
    console.log(UTF8ToString(msg));
});

EM_JS(const char *, get_input, (), {
    let str = document.getElementById('myinput').value;
    // Returns heap-allocated string.
    // C/C++ code is responsible for calling `free` once unused.
    return allocate(intArrayFromString(str), 'i8', ALLOC_NORMAL);
});
