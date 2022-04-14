#include <vector>
#include "base91lib.hpp"
#include <base91.h>
#include <stdio.h>

static char status[32];
static const char *progname;
static char *ibuf, *obuf;
static size_t ibuf_size, llen;

static void stream_b91enc_p(void)
{
    static struct basE91 b91;
    basE91_init(&b91);
    size_t itotal = 0;
    size_t ototal = 0;
    size_t s;

    while ((s = fread(ibuf, 1, ibuf_size, stdin)) > 0)
    {
        itotal += s;
        s = basE91_encode(&b91, ibuf, s, obuf);
        ototal += s;
        fwrite(obuf, 1, s, stdout);
    }
    s = basE91_encode_end(&b91, obuf); /* empty bit queue */
    ototal += s;
    fwrite(obuf, 1, s, stdout);

    sprintf(status, "\t%.2f%%\n", itotal ? (float)ototal / itotal * 100.0 : 1.0);
}

const char *test()
{
    return "42";
}

//  Include JS Glue  ---
// #include "main_glue.cpp"
