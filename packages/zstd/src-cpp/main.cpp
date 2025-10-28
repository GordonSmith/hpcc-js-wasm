#include <zstd.h>
#include <cstdlib>
#include "root.h"

extern "C"
{
    void exports_hpcc_js_zstd_zstd_version(root_string_t *ret)
    {
        root_string_dup(ret, ZSTD_versionString());
    }
    void exports_hpcc_js_zstd_zstd_compress(root_list_u8_t *src, uint32_t compression_level, root_list_u8_t *ret)
    {
        size_t dst_capacity = ZSTD_compressBound(src->len);
        void *dst = malloc(dst_capacity);
        size_t compressed_size = ZSTD_compress(dst, dst_capacity, src->ptr, src->len, compression_level);
        ret->len = compressed_size;
        ret->ptr = (uint8_t *)dst;
    }
    void exports_hpcc_js_zstd_zstd_decompress(root_list_u8_t *src, root_list_u8_t *ret)
    {
        size_t decompressed_size = ZSTD_getFrameContentSize((const void *)src->ptr, src->len);
        ret->len = decompressed_size;
        ret->ptr = (uint8_t *)malloc(decompressed_size);
        ZSTD_decompress((void *)ret->ptr, ret->len, (const void *)src->ptr, src->len);
    }
    uint64_t exports_hpcc_js_zstd_zstd_get_frame_content_size(root_list_u8_t *src)
    {
        return ZSTD_getFrameContentSize((const void *)src->ptr, src->len);
    }
    uint32_t exports_hpcc_js_zstd_zstd_find_frame_compressed_size(root_list_u8_t *src)
    {
        return ZSTD_findFrameCompressedSize((const void *)src->ptr, src->len);
    }
    uint32_t exports_hpcc_js_zstd_zstd_compress_bound(uint32_t src_size)
    {
        return ZSTD_compressBound(src_size);
    }
    uint32_t exports_hpcc_js_zstd_zstd_is_error(uint32_t code)
    {
        return ZSTD_isError(code);
    }
    void exports_hpcc_js_zstd_zstd_get_error_name(uint32_t code, root_string_t *ret)
    {
        root_string_dup(ret, ZSTD_getErrorName(code));
    }
    int32_t exports_hpcc_js_zstd_zstd_min_c_level(void)
    {
        return ZSTD_minCLevel();
    }
    int32_t exports_hpcc_js_zstd_zstd_max_c_level(void)
    {
        return ZSTD_maxCLevel();
    }
    int32_t exports_hpcc_js_zstd_zstd_default_c_level(void)
    {
        return ZSTD_defaultCLevel();
    }
}