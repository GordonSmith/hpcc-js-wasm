#include <stddef.h>

#include "base91lib/base91lib.hpp"

struct base91
{
    const char *xxx()
    {
        return test();
    }
};

#include <emscripten.h>

//  Include JS Glue  ---
#include "main_glue.cpp"
