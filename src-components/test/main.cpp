#include <stdio.h>
#include <string.h>
#include <string>

#include <gvc.h>
#include <gvplugin.h>
#include <graphviz_version.h>
#include <fstream>

#include "hw.h"

void hw_run(void)
{
    hw_string_t msg;
    hw_string_set(&msg, "Hello, World!");
    hw_print(&msg);
    hw_string_free(&msg);

    // const char buff[32] = {0};

    // hw_string_set(&msg, buff);
    // hw_print(&msg);
    // hw_string_free(&msg);
}

int main(int argc, char **argv)
{
    hw_run();
    return 0;
}