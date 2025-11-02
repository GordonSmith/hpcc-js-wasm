#include <stdint.h>
#include <stddef.h>

// Stub implementation of C++ exception handling functions
// These are never actually called because we compile with -fno-exceptions
// but they may be referenced by linked libraries

extern "C"
{

    int _Unwind_RaiseException(void *exception_object)
    {
        // Should never be called - abort
        __builtin_trap();
        return 0;
    }

    // Stub implementations of syscalls that aren't available in WASI
    // These may be referenced by Graphviz libraries but aren't used in our code path

    int __syscall_faccessat(int dirfd, const char *pathname, int mode, int flags)
    {
        return -1; // ENOSYS
    }

    void _msync_js()
    {
        // No-op
    }

    int __syscall_unlinkat(int dirfd, const char *pathname, int flags)
    {
        return -1; // ENOSYS
    }

    int __syscall_rmdir(const char *pathname)
    {
        return -1; // ENOSYS
    }

    int __syscall_readlinkat(int dirfd, const char *pathname, char *buf, size_t bufsiz)
    {
        return -1; // ENOSYS
    }
}
