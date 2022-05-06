#ifndef UTIL_HPP_HEADER
#define UTIL_HPP_HEADER

#include <vector>
#include <iostream>
#include <emscripten/val.h>

class Buffer
{
protected:
    std::vector<uint8_t> m_compressed_data;

public:
    Buffer();
    Buffer(const std::vector<uint8_t> &compressed_data);
    Buffer(const Buffer &b);

    virtual ~Buffer();

    void *data() const;
    std::size_t length() const;
};

template <typename T>
std::vector<T> jsArrayToVector(const emscripten::val &v)
{
    std::vector<T> rv;

    const auto l = v["length"].as<unsigned>();
    rv.resize(l);

    emscripten::val memoryView{emscripten::typed_memory_view(l, rv.data())};
    memoryView.call<void>("set", v);

    return rv;
}

template <typename T>
emscripten::val vectorToJSArray(const std::vector<T> &v)
{
    return emscripten::val::array(v.data(), v.data() + v.size());
}

std::vector<uint8_t> uint8ArrayToVector(const emscripten::val &v);
emscripten::val uint8VectorToArray(const std::vector<uint8_t> &v);

class vectorbuf : public std::streambuf
{
public:
    vectorbuf(const std::vector<uint8_t> &v);
    ~vectorbuf();
};

extern "C" void console_log(const char *msg);

#endif // UTIL_HPP_HEADER