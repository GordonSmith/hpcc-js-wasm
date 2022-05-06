#include <base91lib.hpp>
#include <base91.hpp>
#include <util.hpp>
#include <iostream>
#include <sstream>

struct main
{

    std::string encode(std::vector<uint8_t> data)
    {
        CBase91 base91;
        return base91.encode(data);
    }

    std::vector<uint8_t> decode(std::string str)
    {
        CBase91 base91;
        return base91.decode(str);
    }

    std::string stream_encode(std::vector<uint8_t> data)
    {
        vectorbuf vbuf(data);
        std::istream in(&vbuf);
        std::stringstream out;

        CBase91 base91;
        base91.stream_encode(in, out);

        return out.str();
    }

    std::vector<uint8_t> stream_decode(std::string str)
    {
        std::stringstream in(str);
        std::stringstream out;

        CBase91 base91;
        base91.stream_decode(in, out);
        std::string retVal = out.str();
        return std::vector<uint8_t>(retVal.begin(), retVal.end());
    }

    size_t buf_size2 = 65536;

    const char *encode2(const void *data, size_t size)
    {
        size_t encbuf_size = (buf_size2 - 2) << 4;
        encbuf_size /= 29;
        char *encbuf = reinterpret_cast<char *>(malloc(encbuf_size));

        struct basE91 b91;
        basE91_init(&b91);
        char *buff = (char *)malloc(size * 2);

        size_t total = 0;
        size_t s = basE91_encode(&b91, data, size, buff);
        total += s;
        s = basE91_encode_end(&b91, buff + s);
        total += s;
        std::string retVal(buff, buff + total);

        free(buff);
        free(encbuf);
        return retVal.c_str();
    }

    void decode2(const char *str, size_t strSize, uint8_t *buff, size_t size)
    {
        struct basE91 b91;
        basE91_init(&b91);

        size_t s = basE91_decode(&b91, str, strSize, buff);
        basE91_decode_end(&b91, buff + s); /* empty bit queue */
    }
};

// #include <emscripten.h>

//  Include JS Glue  ---
#include "main_glue.cpp"
