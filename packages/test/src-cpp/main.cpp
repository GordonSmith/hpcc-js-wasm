#include <base91.hpp>
#include <stdlib.h>
#include <string>

size_t buf_size = 65536;

extern "C" std::string encode(const void *data, size_t size)
{
    size_t encbuf_size = (buf_size - 2) << 4;
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
    return retVal;
}

extern "C" void decode(const std::string &str, uint8_t *buff, size_t size)
{
    struct basE91 b91;
    basE91_init(&b91);

    size_t s = basE91_decode(&b91, str.c_str(), str.size(), buff);
    basE91_decode_end(&b91, buff + s); /* empty bit queue */
}
