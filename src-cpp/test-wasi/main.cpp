#include <gvc.h>
#include <gvplugin.h>
#include <graphviz_version.h>

#include "test_wasi.h"

void exports_hpcc_wasm_test_wasi_guest_version(test_wasi_string_t *ret)
{
    test_wasi_string_dup(ret, PACKAGE_VERSION);
    hpcc_wasm_test_wasi_host_log(ret);
}
