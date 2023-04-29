#include <stdio.h>
#include <string.h>
#include <string>
#include "hw.h"

// int main(int argc, char **argv)
// {
//     return 0;
// }

void hw_run(void)
{
    hw_string_t msg;
    hw_string_set(&msg, "Hello, World!");
    hw_print(&msg);
    hw_string_free(&msg);
}
