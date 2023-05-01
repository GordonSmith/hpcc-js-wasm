set(VCPKG_ENV_PASSTHROUGH_UNTRACKED WASI_SDK_PREFIX PATH)

if(NOT DEFINED ENV{WASI_SDK_PREFIX})
   find_path(WASI_SDK_PREFIX "wasi_snapshot_preview1.command.wasm" HINTS ${CMAKE_CURRENT_SOURCE_DIR}/../wasi-sdk-20.0)
else()
   set(WASI_SDK_PREFIX "$ENV{WASI_SDK_PREFIX}")
endif()

message("CMAKE_CURRENT_SOURCE_DIR: ${CMAKE_CURRENT_SOURCE_DIR}")
message("WASI_SDK_PREFIX: ${WASI_SDK_PREFIX}")

if(NOT EXISTS "${WASI_SDK_PREFIX}/share/cmake/wasi-sdk.cmake")
   message(FATAL_ERROR "wasi-sdk.cmake toolchain file not found")
endif()

set(ENV{WASI_SDK_PREFIX} "${WASI_SDK_PREFIX}")
set(VCPKG_WASI_SDK_PREFIX "${WASI_SDK_PREFIX}")

set(VCPKG_CMAKE_SYSTEM_NAME WASI)
set(VCPKG_CMAKE_SYSTEM_VERSION 1)
# set(VCPKG_TARGET_ARCHITECTURE x86)
set(VCPKG_CMAKE_SYSTEM_PROCESSOR wasm32)
set(VCPKG_CRT_LINKAGE dynamic)
set(VCPKG_LIBRARY_LINKAGE static)
# set(VCPKG_MAKE_BUILD_TRIPLET "--host=wasm32-wasi")
# set(VCPKG_C_FLAGS "${VCPKG_C_FLAGS} -D_WASI_EMULATED_SIGNAL")
# set(VCPKG_CXX_FLAGS "${VCPKG_CXX_FLAGS} -D_WASI_EMULATED_SIGNAL")
# set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
# set(VCPKG_C_FLAGS "${VCPKG_C_FLAGS} -fno-exceptions -mexec-model=reactor --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")
# set(VCPKG_CXX_FLAGS "${VCPKG_CXX_FLAGS} -fno-exceptions -mexec-model=reactor --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

set(VCPKG_C_FLAGS "${VCPKG_C_FLAGS} -fno-exceptions -D_WASI_EMULATED_SIGNAL -Wl,-lwasi-emulated-signal -D_WASI_EMULATED_MMAN -Wl,-lwasi-emulated-mman -nostartfiles -Wl,--no-entry -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")
set(VCPKG_CXX_FLAGS "${VCPKG_CXX_FLAGS} -fno-exceptions -D_WASI_EMULATED_SIGNAL -Wl,-lwasi-emulated-signal -D_WASI_EMULATED_MMAN -Wl,-lwasi-emulated-mman -nostartfiles -Wl,--no-entry -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

set(VCPKG_CHAINLOAD_TOOLCHAIN_FILE "${WASI_SDK_PREFIX}/share/cmake/wasi-sdk.cmake")

# set(CMAKE_SYSTEM_NAME WASI)
# set(CMAKE_SYSTEM_VERSION 1)
# set(CMAKE_SYSTEM_PROCESSOR wasm32)
# set(triple wasm32-wasi)

# if(WIN32)
# 	set(WASI_HOST_EXE_SUFFIX ".exe")
# else()
# 	set(WASI_HOST_EXE_SUFFIX "")
# endif()

# if(NOT DEFINED ENV{WASI_SDK_PREFIX})
#    find_path(WASI_SDK_PREFIX "wasi_snapshot_preview1.command.wasm" HINTS ${CMAKE_CURRENT_SOURCE_DIR}/../wasi-sdk-20.0)
# else()
#    set(WASI_SDK_PREFIX "$ENV{WASI_SDK_PREFIX}")
# endif()

# set(CMAKE_C_COMPILER ${WASI_SDK_PREFIX}/bin/clang${WASI_HOST_EXE_SUFFIX})
# set(CMAKE_CXX_COMPILER ${WASI_SDK_PREFIX}/bin/clang++${WASI_HOST_EXE_SUFFIX})
# set(CMAKE_ASM_COMPILER ${WASI_SDK_PREFIX}/bin/clang${WASI_HOST_EXE_SUFFIX})
# set(CMAKE_AR ${WASI_SDK_PREFIX}/bin/llvm-ar${WASI_HOST_EXE_SUFFIX})
# set(CMAKE_RANLIB ${WASI_SDK_PREFIX}/bin/llvm-ranlib${WASI_HOST_EXE_SUFFIX})
# set(CMAKE_C_COMPILER_TARGET ${triple})
# set(CMAKE_CXX_COMPILER_TARGET ${triple})
# set(CMAKE_ASM_COMPILER_TARGET ${triple})

# # Don't look in the sysroot for executables to run during the build
# set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
# # Only look in the sysroot (not in the host paths) for the rest
# set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
# set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
# set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
