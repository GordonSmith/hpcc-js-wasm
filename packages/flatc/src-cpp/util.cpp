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
    fflush(stdout);
    outBackup = dup(fileno(stdout));
    freopen("output.txt", "w", stdout);

    fflush(stderr);
    errBackup = dup(fileno(stderr));
    freopen("error.txt", "w", stderr);
}

OutErrRedirect::~OutErrRedirect()
{
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
