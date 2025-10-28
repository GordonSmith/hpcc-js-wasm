#include <base91.hpp>
#include <cstdlib>
#include "root.h"

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

extern "C"
{
    exports_hpcc_js_base91_resources_own_base91_t exports_hpcc_js_base91_resources_constructor_base91(void)
    {
        CBasE91 *instance = new CBasE91();
        return exports_hpcc_js_base91_resources_base91_new((exports_hpcc_js_base91_resources_base91_t *)instance);
    }

    void exports_hpcc_js_base91_resources_base91_destructor(exports_hpcc_js_base91_resources_base91_t *rep)
    {
        CBasE91 *instance = (CBasE91 *)rep;
        delete instance;
    }

    void exports_hpcc_js_base91_resources_method_base91_version(exports_hpcc_js_base91_resources_borrow_base91_t self, root_string_t *ret)
    {
        CBasE91 *instance = (CBasE91 *)self;
        root_string_dup(ret, instance->version());
    }

    void exports_hpcc_js_base91_resources_method_base91_reset(exports_hpcc_js_base91_resources_borrow_base91_t self)
    {
        CBasE91 *instance = (CBasE91 *)self;
        instance->reset();
    }

    void exports_hpcc_js_base91_resources_method_base91_encode(exports_hpcc_js_base91_resources_borrow_base91_t self, root_list_u8_t *data, root_string_t *ret)
    {
        CBasE91 *instance = (CBasE91 *)self;

        // Allocate buffer for encoded output (worst case: ~123% of input size)
        size_t maxOutputSize = data->len + (data->len / 4) + 10;
        char *output = (char *)malloc(maxOutputSize);

        size_t encodedLen = instance->encode(data->ptr, data->len, output);
        output[encodedLen] = '\0';

        root_string_set(ret, output);
    }

    void exports_hpcc_js_base91_resources_method_base91_encode_end(exports_hpcc_js_base91_resources_borrow_base91_t self, root_string_t *ret)
    {
        CBasE91 *instance = (CBasE91 *)self;

        char *output = (char *)malloc(10); // encode_end produces at most a few bytes (less than 10)
        size_t encodedLen = instance->encode_end(output);
        output[encodedLen] = '\0';

        root_string_set(ret, output);
    }

    void exports_hpcc_js_base91_resources_method_base91_decode(exports_hpcc_js_base91_resources_borrow_base91_t self, root_string_t *data, root_list_u8_t *ret)
    {
        CBasE91 *instance = (CBasE91 *)self;

        // Allocate buffer for decoded output (worst case: same size as input)
        size_t maxOutputSize = data->len;
        uint8_t *output = (uint8_t *)malloc(maxOutputSize);

        size_t decodedLen = instance->decode(data->ptr, data->len, output);

        ret->ptr = output;
        ret->len = decodedLen;
    }

    void exports_hpcc_js_base91_resources_method_base91_decode_end(exports_hpcc_js_base91_resources_borrow_base91_t self, root_string_t *ret)
    {
        CBasE91 *instance = (CBasE91 *)self;

        uint8_t output[10]; // decode_end produces at most a few bytes
        size_t decodedLen = instance->decode_end(output);
        output[decodedLen] = '\0';

        root_string_set(ret, (const char *)output);
    }
}
