vcpkg_from_github(
    OUT_SOURCE_PATH SOURCE_PATH
    REPO bytecodealliance/wasm-micro-runtime
    REF WAMR-${VERSION}
    SHA512 0da9ba63a09fc45d60cfe98c9562f2db458a0de4947b697c58ecb45ad4d40718a7fa60bf55b824b1a9c65526c89764f10b5fa161fb0f6b0eb38b3f281cf28692
    HEAD_REF main
)

vcpkg_check_features(OUT_FEATURE_OPTIONS FEATURE_OPTIONS
    FEATURES
        interpreter         WAMR_BUILD_INTERP
        aot                 WAMR_BUILD_AOT
        jit                 WAMR_BUILD_JIT
        fast-jit            WAMR_BUILD_FAST_JIT
        libc-builtin        WAMR_BUILD_LIBC_BUILTIN
        libc-wasi           WAMR_BUILD_LIBC_WASI
        fast-interpreter    WAMR_BUILD_FAST_INTERP
        multi-modules       WAMR_BUILD_MULTI_MODULE
        lib-pthread         WAMR_BUILD_LIB_PTHREAD
        lib-wasi-threads    WAMR_BUILD_LIB_WASI_THREADS
        mini-loader         WAMR_BUILD_MINI_LOADER
        simd                WAMR_BUILD_SIMD
        ref-types           WAMR_BUILD_REF_TYPES
)
# Replace "ON" with 1 and "OFF" with 0 in the list
string(REPLACE "=ON" "=1" FEATURE_OPTIONS "${FEATURE_OPTIONS}")
string(REPLACE "=OFF" "=0" FEATURE_OPTIONS "${FEATURE_OPTIONS}")

# include(FetchContent)

# set(FETCHCONTENT_BASE_DIR "${SOURCE_PATH}/core/iwasm/fast-jit/_deps")

# FetchContent_Populate(
#   asmjit
#   GIT_REPOSITORY https://github.com/asmjit/asmjit.git
#   GIT_TAG c1019f1642a588107148f64ba54584b0ae3ec8d1
#   PATCH_COMMAND  git apply ${SOURCE_PATH}/core/iwasm/fast-jit/asmjit_sgx_patch.diff
#   SOURCE_DIR ${SOURCE_PATH}/core/iwasm/fast-jit
# )

# # vcpkg/buildtrees/wasm-micro-runtime/src/WAMR-1.2.1-a59228819a.clean/core/iwasm/fast-jit/iwasm_fast_jit.cmake
# message("${SOURCE_PATH}/core/iwasm/fast-jit/iwasm_fast_jit.cmake")
# # Read the content of the file
# file(READ "${SOURCE_PATH}/core/iwasm/fast-jit/iwasm_fast_jit.cmake" FILE_CONTENT)

# string(REPLACE "FetchContent_Populate"
#                "FetchContent_MakeAvailable"
#                FILE_CONTENT "${FILE_CONTENT}")

# string(REPLACE "FetchContent_GetProperties(asmjit)"
#                ""
#                FILE_CONTENT "${FILE_CONTENT}")

# Replace the string in the content
# string(REPLACE "set (IWASM_FAST_JIT_DIR \${CMAKE_CURRENT_LIST_DIR})"
#                "set (IWASM_FAST_JIT_DIR \${CMAKE_CURRENT_BINARY_DIR}/_deps)"
#                FILE_CONTENT "${FILE_CONTENT}"
# )

# string(REPLACE "include(FetchContent)"
#                "include(FetchContent)\nset(FETCHCONTENT_BASE_DIR \"\${SOURCE_PATH}/core/iwasm/fast-jit/src/asmjit\")\nfind_package(asmjit CONFIG REQUIRED)\n"
#                FILE_CONTENT "${FILE_CONTENT}")

# string(REPLACE "FetchContent_Populate(asmjit)"
#                 "FetchContent_Populate(asmjit)\nmessage(\"asmjit2: \${asmjit_SOURCE_DIR} : \${asmjit_BINARY_DIR} : \${asmjit_POPULATED}\")\n"
#                 FILE_CONTENT "${FILE_CONTENT}")

# # Write the modified content back to the file
# file(WRITE "${SOURCE_PATH}/core/iwasm/fast-jit/iwasm_fast_jit.cmake" "${FILE_CONTENT}")

file(READ "${SOURCE_PATH}/core/iwasm/fast-jit/iwasm_fast_jit.cmake" FILE_CONTENT)

string(REPLACE "PATCH_COMMAND  git apply \${IWASM_FAST_JIT_DIR}/asmjit_sgx_patch.diff"
                "PATCH_COMMAND  git apply \${IWASM_FAST_JIT_DIR}/asmjit_sgx_patch.diff\nCMAKE_GENERATOR \${CMAKE_GENERATOR}\nCMAKE_MAKE_PROGRAM \${CMAKE_MAKE_PROGRAM}"
                FILE_CONTENT "${FILE_CONTENT}")

string(REPLACE "add_definitions(-DASMJIT_STATIC)"
                "add_definitions(-DASMJIT_EMBED)"
                FILE_CONTENT "${FILE_CONTENT}")

file(WRITE "${SOURCE_PATH}/core/iwasm/fast-jit/iwasm_fast_jit.cmake" "${FILE_CONTENT}")

vcpkg_cmake_configure(
    SOURCE_PATH "${SOURCE_PATH}"
    DISABLE_PARALLEL_CONFIGURE
    OPTIONS
        -DFETCHCONTENT_FULLY_DISCONNECTED=OFF
        # -DFETCHCONTENT_TRY_FIND_PACKAGE_MODE=ALWAYS
        ${FEATURE_OPTIONS}
    MAYBE_UNUSED_VARIABLES
        CMAKE_INSTALL_BINDIR
        CMAKE_INSTALL_LIBDIR
        FETCHCONTENT_FULLY_DISCONNECTED
        VCPKG_PLATFORM_TOOLSET
        VCPKG_SET_CHARSET_FLAG
        _VCPKG_ROOT_DIR
)
vcpkg_cmake_install()

file(REMOVE_RECURSE "${CURRENT_PACKAGES_DIR}/debug/include")
file(INSTALL "${SOURCE_PATH}/LICENSE" DESTINATION "${CURRENT_PACKAGES_DIR}/share/${PORT}" RENAME copyright)
