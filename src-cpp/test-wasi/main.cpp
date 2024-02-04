#include "test_wasi.h"

#include <string>

std::string s;
void test_wasi_echo(test_wasi_string_t *msg, test_wasi_string_t *ret)
{
    std::string tmp((const char *)msg->ptr, msg->len);
    tmp += ":echo";

    test_wasi_string_dup(ret, s.c_str());
    test_wasi_print(ret);
}

uint32_t test_wasi_add(uint32_t a, uint32_t b)
{
    test_wasi_string_t msg;
    test_wasi_string_dup(&msg, "test_add");
    test_wasi_print(&msg);
    return a + b;
}

uint32_t test_wasi_sub(uint32_t a, uint32_t b)
{
    test_wasi_string_t msg;
    test_wasi_string_dup(&msg, "test_sub");
    test_wasi_print(&msg);
    return a - b;
}
