#include <cstdio>
#include <memory>
#include <stdlib.h>

#include "bfbs_gen_lua.h"
#include "bfbs_gen_nim.h"
#include "flatbuffers/base.h"
#include "flatbuffers/code_generator.h"
#include "flatbuffers/flatc.h"
#include "flatbuffers/util.h"
#include "idl_gen_binary.h"
#include "idl_gen_cpp.h"
#include "idl_gen_csharp.h"
#include "idl_gen_dart.h"
#include "idl_gen_fbs.h"
#include "idl_gen_go.h"
#include "idl_gen_java.h"
#include "idl_gen_json_schema.h"
#include "idl_gen_kotlin.h"
#include "idl_gen_lobster.h"
#include "idl_gen_php.h"
#include "idl_gen_python.h"
#include "idl_gen_rust.h"
#include "idl_gen_swift.h"
#include "idl_gen_text.h"
#include "idl_gen_ts.h"

static const char *g_program_name = nullptr;

static void Warn(const flatbuffers::FlatCompiler *flatc, const std::string &warn, bool show_exe_name)
{
    (void)flatc;
    if (show_exe_name)
    {
        printf("%s: ", g_program_name);
    }
    fprintf(stderr, "\nwarning:\n  %s\n\n", warn.c_str());
}

static void Error(const flatbuffers::FlatCompiler *flatc, const std::string &err, bool usage, bool show_exe_name)
{
    if (show_exe_name)
    {
        printf("%s: ", g_program_name);
    }
    if (usage && flatc)
    {
        fprintf(stderr, "%s\n", flatc->GetShortUsageString(g_program_name).c_str());
    }
    fprintf(stderr, "\nerror:\n  %s\n\n", err.c_str());
    exit(1);
}

namespace flatbuffers
{
    void LogCompilerWarn(const std::string &warn)
    {
        Warn(static_cast<const flatbuffers::FlatCompiler *>(nullptr), warn, true);
    }
    void LogCompilerError(const std::string &err)
    {
        Error(static_cast<const flatbuffers::FlatCompiler *>(nullptr), err, false, true);
    }
} // namespace flatbuffers

namespace main
{
    int main(int argc, const char *argv[])
    {
        const std::string flatbuffers_version(flatbuffers::FLATBUFFERS_VERSION());

        g_program_name = argv[0];

        flatbuffers::FlatCompiler::InitParams params;
        params.warn_fn = Warn;
        params.error_fn = Error;

        flatbuffers::FlatCompiler flatc(params);

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{
                "b", "binary", "",
                "Generate wire format binaries for any data definitions"},
            flatbuffers::NewBinaryCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"c", "cpp", "",
                                     "Generate C++ headers for tables/structs"},
            flatbuffers::NewCppCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"n", "csharp", "",
                                     "Generate C# classes for tables/structs"},
            flatbuffers::NewCSharpCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"d", "dart", "",
                                     "Generate Dart classes for tables/structs"},
            flatbuffers::NewDartCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"", "proto", "",
                                     "Input is a .proto, translate to .fbs"},
            flatbuffers::NewFBSCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"g", "go", "",
                                     "Generate Go files for tables/structs"},
            flatbuffers::NewGoCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"j", "java", "",
                                     "Generate Java classes for tables/structs"},
            flatbuffers::NewJavaCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"", "jsonschema", "", "Generate Json schema"},
            flatbuffers::NewJsonSchemaCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"", "kotlin", "",
                                     "Generate Kotlin classes for tables/structs"},
            flatbuffers::NewKotlinCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"", "kotlin-kmp", "",
                                     "Generate Kotlin multiplatform classes for tables/structs"},
            flatbuffers::NewKotlinKMPCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"", "lobster", "",
                                     "Generate Lobster files for tables/structs"},
            flatbuffers::NewLobsterCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"l", "lua", "",
                                     "Generate Lua files for tables/structs"},
            flatbuffers::NewLuaBfbsGenerator(flatbuffers_version));

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"", "nim", "",
                                     "Generate Nim files for tables/structs"},
            flatbuffers::NewNimBfbsGenerator(flatbuffers_version));

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"p", "python", "",
                                     "Generate Python files for tables/structs"},
            flatbuffers::NewPythonCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"", "php", "",
                                     "Generate PHP files for tables/structs"},
            flatbuffers::NewPhpCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"r", "rust", "",
                                     "Generate Rust files for tables/structs"},
            flatbuffers::NewRustCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{
                "t", "json", "", "Generate text output for any data definitions"},
            flatbuffers::NewTextCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"", "swift", "",
                                     "Generate Swift files for tables/structs"},
            flatbuffers::NewSwiftCodeGenerator());

        flatc.RegisterCodeGenerator(
            flatbuffers::FlatCOption{"T", "ts", "",
                                     "Generate TypeScript code for tables/structs"},
            flatbuffers::NewTsCodeGenerator());

        // Create the FlatC options by parsing the command line arguments.
        const flatbuffers::FlatCOptions &options =
            flatc.ParseFromCommandLineArguments(argc, argv);

        // Compile with the extracted FlatC options.
        return flatc.Compile(options);
    }
}
//  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---
#include "util.hpp"
int mainMain(std::vector<std::string> &args, std::vector<std::string> &retVal)
{
    args.insert(args.begin(), "flatclib.wasm");

    int argc = args.size();
    char **argv = new char *[argc];
    for (int i = 0; i < argc; i++)
    {
        argv[i] = new char[args[i].size() + 1];
        strcpy(argv[i], args[i].c_str());
    }

    int ret = 0;
    {
        OutErrRedirect outerr;
        ret = main::main(argc, const_cast<const char **>(argv));
    }
    readOutFile(retVal);
    readErrorFile(retVal);

    return ret;
}

std::string version()
{
    return flatbuffers::FLATBUFFERS_VERSION();
}

#include <emscripten/bind.h>
EMSCRIPTEN_BINDINGS(llama_module)
{
    emscripten::register_vector<std::string>("VectorString");
    emscripten::function("main", &mainMain);
    emscripten::function("version", &version);
}
