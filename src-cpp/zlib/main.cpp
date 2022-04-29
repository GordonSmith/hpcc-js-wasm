#include "main.hpp"
#include "zlib-helper.hpp"
#include <string>
#include <string.h>
#include <zlib.h>

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

void Buffer::fromBase91(const char *str)
{
}

const char *Buffer::toBase91() const
{
    // size_t buf_size = 65536; /* buffer memory defaults to 64 KiB */
    // char *ifile = "from standard input";
    // char *ofile = NULL;
    // int opt;

    // ibuf = obuf + buf_size - ibuf_size; /* partial overlap */
    // stream_b91enc_p();

    return "";
}

std::vector<unsigned char> decompressedData;
struct Zlib
{
    const char *version()
    {
        return ZLIB_VERSION;
    }

    Buffer compressString(const char *str)
    {
        std::vector<unsigned char> compressedData;
        compress_memory((void *)str, strlen(str) + 1, compressedData);
        return Buffer(compressedData);
    }

    const char *decompressString(Buffer buff)
    {
        decompressedData.clear();
        decompress_memory((void *)buff.data(), buff.length(), decompressedData);
        return (const char *)&decompressedData[0];
    }
};

//  Include JS Glue  ---
#include "main_glue.cpp"
