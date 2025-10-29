#include "util.hpp"
#include <stdio.h>
#include <unistd.h>
#include <fstream>
#include <sstream>

const char *const LLAMALIB_WASM = "llamalib.wasm";

ArgBuffer::ArgBuffer(const std::vector<std::string> &args)
{
    argc = args.size() + 1;
    argv = new char *[argc];
    argv[0] = const_cast<char *>(LLAMALIB_WASM);
    for (int i = 1; i < argc; i++)
    {
        argv[i] = const_cast<char *>(args.at(i - 1).c_str());
    }
}

ArgBuffer::~ArgBuffer()
{
    delete[] argv;
}

OutErrRedirect::OutErrRedirect()
{
#ifndef __EMSCRIPTEN_PTHREADS__
    // File descriptor duplication not supported in WASI/standalone builds
    outBackup = -1;
    errBackup = -1;
    // Note: stdout/stderr redirection disabled for WASI compatibility
#else
    fflush(stdout);
    outBackup = dup(fileno(stdout));
    freopen("output.txt", "w", stdout);

    fflush(stderr);
    errBackup = dup(fileno(stderr));
    freopen("error.txt", "w", stderr);
#endif
}

OutErrRedirect::~OutErrRedirect()
{
#ifndef __EMSCRIPTEN_PTHREADS__
    // File descriptor operations not supported in WASI/standalone builds
    fflush(stderr);
    fflush(stdout);
#else
    if (errBackup != -1)
    {
        fflush(stderr);
        dup2(errBackup, fileno(stderr));
        close(errBackup);
    }

    if (outBackup != -1)
    {
        fflush(stdout);
        dup2(outBackup, fileno(stdout));
        close(outBackup);
    }
#endif
}

void readOutFile(std::vector<std::string> &retVal)
{
    std::ifstream file("output.txt");
    std::stringstream output;
    output << file.rdbuf();
    retVal.push_back(output.str());
}

void readErrorFile(std::vector<std::string> &retVal)
{
    std::ifstream file("error.txt");
    std::stringstream output;
    output << file.rdbuf();
    retVal.push_back(output.str());
}

// Filesystem operations for WIT interface
#include "root.h"

bool exports_hpcc_js_llama_llama_write_file(root_string_t *path, root_list_u8_t *data)
{
    std::string filepath(reinterpret_cast<const char *>(path->ptr), path->len);

    try
    {
        fprintf(stderr, "[write_file] Attempting to write %zu bytes to: %s\n", data->len, filepath.c_str());

        std::ofstream file(filepath, std::ios::binary);
        if (!file.is_open())
        {
            fprintf(stderr, "[write_file] Failed to open file: %s\n", filepath.c_str());
            return false;
        }

        file.write(reinterpret_cast<const char *>(data->ptr), data->len);
        if (!file.good())
        {
            fprintf(stderr, "[write_file] Failed to write data to file: %s\n", filepath.c_str());
            file.close();
            return false;
        }

        file.close();
        fprintf(stderr, "[write_file] Successfully wrote file: %s\n", filepath.c_str());
        return true;
    }
    catch (const std::exception &e)
    {
        fprintf(stderr, "[write_file] Exception: %s\n", e.what());
        return false;
    }
    catch (...)
    {
        fprintf(stderr, "[write_file] Unknown exception\n");
        return false;
    }
}

void exports_hpcc_js_llama_llama_read_file(root_string_t *path, root_list_u8_t *ret)
{
    std::string filepath(reinterpret_cast<const char *>(path->ptr), path->len);

    try
    {
        std::ifstream file(filepath, std::ios::binary | std::ios::ate);
        if (!file.is_open())
        {
            ret->ptr = nullptr;
            ret->len = 0;
            return;
        }

        std::streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);

        uint8_t *buffer = (uint8_t *)malloc(size);
        if (!buffer || !file.read(reinterpret_cast<char *>(buffer), size))
        {
            ret->ptr = nullptr;
            ret->len = 0;
            if (buffer)
                free(buffer);
            return;
        }

        ret->ptr = buffer;
        ret->len = size;
    }
    catch (...)
    {
        ret->ptr = nullptr;
        ret->len = 0;
    }
}

bool exports_hpcc_js_llama_llama_delete_file(root_string_t *path)
{
    std::string filepath(reinterpret_cast<const char *>(path->ptr), path->len);

    // In WASI, file deletion may not be supported in all contexts
    // For now, we'll just return false to indicate the operation is not supported
    // The JavaScript side can handle cleanup differently if needed
    (void)filepath; // Suppress unused variable warning
    return false;
}
