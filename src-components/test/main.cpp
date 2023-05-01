#include <stdio.h>
#include <string.h>
#include <string>

#include "graphviz.hpp"
#include "hw.h"

void hw_run(void)
{
    hw_string_t msg;
    hw_string_set(&msg, "Hello, World!");
    hw_print(&msg);
    hw_string_free(&msg);

    const char *dot = "digraph G {Hello->World}";

    // Graphviz gv;
    // const char *svg = gv.layout("digraph G {Hello->World}", "svg", "dot");
    // hw_string_set(&msg, svg);
    // hw_print(&msg);
    // hw_string_free(&msg);
}

// int main(int argc, char **argv)
// {
//     hw_run();
//     return 0;
// }