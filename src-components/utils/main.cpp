#include "utils.h"
#include <string>
#include <base91.hpp>

const char *const version = "0.6.0";

class CBasE91
{
protected:
    basE91 m_basE91;

public:
    CBasE91()
    {
        reset();
    }

    void *malloc(size_t __size)
    {
        return ::malloc(__size);
    }

    void free(void *__ptr)
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

#ifdef __cplusplus
extern "C"
{
#endif

    void utils_hello(utils_string_t *name, utils_string_t *ret)
    {
        // auto base91 = new CBasE91();
        // iterator_row_t row;
        // itr_next(&row);

        // while (!row.done)
        // {
        //     base91->encode(row.value.ptr, row.value.len, ret->ptr);
        //     iterator_row_free(&row);
        //     itr_next(&row);
        // }

        std::string name_str(name->ptr, name->len);
        std::string ret_str = "Hello, " + name_str + "!";
        utils_string_dup(ret, ret_str.c_str());
        auto base91 = new CBasE91();
        base91->encode("Hello, World!", 13, ret->ptr);
        base91->encode_end(ret->ptr);
        ret->len = strlen(ret->ptr);
        delete base91;
    }

#ifdef __cplusplus
}
#endif
