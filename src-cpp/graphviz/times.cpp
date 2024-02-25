#include <sys/types.h>
#include <sys/times.h>
#include <sys/param.h>

typedef struct tms mytime_t;
clock_t times(struct tms *__buffer)
{
    __buffer->tms_utime = 0;
    __buffer->tms_stime = 0;
    __buffer->tms_cutime = 0;
    __buffer->tms_cstime = 0;
    return 0;
}
