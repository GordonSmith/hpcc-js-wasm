#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <iostream>
#include <sstream>
#include <base91.hpp>

using namespace emscripten;

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

std::vector<uint8_t> uint8ArrayToVector(const emscripten::val &v)
{
    return jsArrayToVector<uint8_t>(v);
}

emscripten::val uint8VectorToArray(const std::vector<uint8_t> &v)
{
    return vectorToJSArray(v);
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

const char *const hw = "Hello, World!, 123";
std::string encode2(std::vector<uint8_t> data)
{
    console_log("encode");
    basE91 b91;
    basE91_init(&b91);
    size_t s = 0;
    void *buff = malloc(data.size() * 2);
    s = basE91_encode(&b91, data.data(), data.size(), buff);
    s += basE91_encode_end(&b91, buff);
    std::string retVal((char *)buff, s);
    console_log(retVal.c_str());
    free(buff);
    console_log("encode");
    return retVal;
}

size_t buf_size = 65536;

class vectorbuf : public std::streambuf
{
public:
    vectorbuf(std::vector<uint8_t> &v)
    {
        setg((char *)v.data(), (char *)v.data(), (char *)(v.data() + v.size()));
    }
    ~vectorbuf() {}
};

std::string encode(std::vector<uint8_t> data)
{
    size_t encbuf_size = (buf_size - 2) << 4;
    encbuf_size /= 29;
    char *encbuf = reinterpret_cast<char *>(malloc(encbuf_size));
    char *obuf = reinterpret_cast<char *>(malloc(buf_size));

    vectorbuf vbuf(data);
    std::istream in(&vbuf);
    std::stringstream out;

    struct basE91 b91;
    basE91_init(&b91);
    size_t itotal = 0;
    size_t ototal = 0;
    size_t s;

    while (in.good())
    {
        in.read(encbuf, encbuf_size);
        auto llen = in.gcount();
        itotal += llen;
        if (llen > 0)
        {
            s = basE91_encode(&b91, encbuf, llen, obuf);
            out.write(obuf, s);
            ototal += s;
        }
    }
    s = basE91_encode_end(&b91, obuf); /* empty bit queue */
    ototal += s;
    out.write(obuf, s);
    // sprintf(status, "\t%.2f%%\n", itotal ? (float)ototal / itotal * 100.0 : 1.0);

    free(obuf);
    free(encbuf);
    return out.str();
}

std::string test(const std::string &str)
{
    return std::string(str.c_str(), str.c_str() + str.size());
}

std::vector<uint8_t> decode2(std::string str)
{
    console_log(str.c_str());
    struct basE91 b91;
    basE91_init(&b91);
    uint8_t *buff = (uint8_t *)malloc(str.size());
    size_t s = basE91_decode(&b91, str.c_str(), str.size(), buff);
    s += basE91_decode_end(&b91, buff); /* empty bit queue */
    std::vector<uint8_t> retVal;
    retVal.assign(buff, buff + s);
    free(buff);
    return retVal;
}

std::vector<uint8_t> decode(std::string str)
{
    size_t decbuf_size = (buf_size - 1) << 3;
    decbuf_size /= 15;

    char *decbuf = reinterpret_cast<char *>(malloc(decbuf_size));
    char *obuf = reinterpret_cast<char *>(malloc(buf_size));

    std::stringstream in(str);
    std::vector<uint8_t> out;

    struct basE91 b91;
    basE91_init(&b91);
    size_t itotal = 0;
    size_t ototal = 0;
    size_t s;
    while (in.good())
    {
        in.read(decbuf, decbuf_size);
        auto llen = in.gcount();
        itotal += llen;
        if (llen > 0)
        {
            s = basE91_decode(&b91, decbuf, llen, obuf);
            out.insert(out.end(), (uint8_t *)obuf, (uint8_t *)obuf + s);
            ototal += s;
        }
    }
    s = basE91_decode_end(&b91, obuf); /* empty bit queue */
    ototal += s;
    out.insert(out.end(), (uint8_t *)obuf, (uint8_t *)obuf + s);

    free(obuf);
    free(decbuf);

    return out;
}

EMSCRIPTEN_BINDINGS(my_module)
{
    function("test", &test);
    function("encode", &encode);
    function("decode", &decode);
    function("uint8ArrayToVector", &uint8ArrayToVector);
    function("uint8VectorToArray", &uint8VectorToArray);
    register_vector<uint8_t>("vector<uint8_t>");
}
