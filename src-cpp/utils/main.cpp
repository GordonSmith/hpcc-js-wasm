#include "utils_xxx.h"

const char *const version = "0.6.0";

void utils_xxx_version(utils_xxx_string_t *ret)
{
    utils_xxx_string_set(ret, version);
}
