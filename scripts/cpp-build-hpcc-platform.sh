#!/bin/bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "$script_dir/.." && pwd)"
hpcc_platform_dir="${HPCC_PLATFORM_DIR:-$repo_dir/hpcc-platform}"
build_dir="$repo_dir/build/packages/hpcc-platform"
vcpkg_files_dir="$repo_dir/build"
overlay_ports="$repo_dir/vcpkg-overlays;$hpcc_platform_dir/vcpkg_overlays;$hpcc_platform_dir/vcpkg/overlays"
overlay_triplets="$repo_dir/vcpkg-overlays;$repo_dir/vcpkg_overlays"
emsdk_dir="${EMSDK:-$repo_dir/emsdk}"
emsdk_env="$emsdk_dir/emsdk_env.sh"
vcpkg_toolchain="$hpcc_platform_dir/vcpkg/scripts/buildsystems/vcpkg.cmake"
emscripten_toolchain="$emsdk_dir/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake"

if [ ! -d "$hpcc_platform_dir" ]
then
    echo "hpcc-platform source directory not found at $hpcc_platform_dir" >&2
    exit 1
fi

if [ ! -f "$emsdk_env" ]
then
    echo "emsdk_env.sh not found at $emsdk_env" >&2
    exit 1
fi

if [ ! -f "$emscripten_toolchain" ]
then
    echo "Emscripten toolchain file not found at $emscripten_toolchain" >&2
    exit 1
fi

source "$emsdk_env"

if [ -d "/opt/homebrew/opt/bison/bin" ]
then
    export PATH="/opt/homebrew/opt/bison/bin:$PATH"
fi

if [ -d "/opt/homebrew/opt/flex/bin" ]
then
    export PATH="/opt/homebrew/opt/flex/bin:$PATH"
fi

if [ ! -f "$build_dir/build.ninja" ]
then
    cmake -S "$hpcc_platform_dir" -B "$build_dir" -G Ninja \
        -DEMSCRIPTEN=ON \
        -DCMAKE_BUILD_TYPE=MinSizeRel \
        -DCMAKE_C_FLAGS="-fwasm-exceptions -Wno-error=unused-variable -Wno-error=unused-but-set-variable -Wno-error=unused-but-set-global -Wno-error=sign-compare -Wno-error=experimental" \
        -DCMAKE_CXX_FLAGS="-fwasm-exceptions -Wno-error=unused-variable -Wno-error=unused-but-set-variable -Wno-error=unused-but-set-global -Wno-error=sign-compare -Wno-error=experimental" \
        -DCMAKE_EXE_LINKER_FLAGS="-fwasm-exceptions -Wno-error=experimental -Wno-error=js-compiler -sERROR_ON_UNDEFINED_SYMBOLS=0 -sWARN_ON_UNDEFINED_SYMBOLS=0 -L$build_dir/MinSizeRel/libs" \
        -DCMAKE_SHARED_LINKER_FLAGS="-fwasm-exceptions -Wno-error=experimental -Wno-error=js-compiler -sERROR_ON_UNDEFINED_SYMBOLS=0 -sWARN_ON_UNDEFINED_SYMBOLS=0 -L$build_dir/MinSizeRel/libs" \
        -DVCPKG_FILES_DIR="$build_dir" \
        -DVCPKG_OVERLAY_PORTS="$overlay_ports" \
        -DVCPKG_OVERLAY_TRIPLETS="$overlay_triplets" \
        -DCONTAINERIZED=OFF \
        -DUSE_OPTIONAL=OFF \
        -DUSE_CPPUNIT=OFF \
        -DINCLUDE_PLUGINS=OFF \
        -DSUPPRESS_V8EMBED=ON \
        -DSUPPRESS_REMBED=ON \
        -DWSSQL_SERVICE=OFF \
        -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE="$emscripten_toolchain" \
        -DVCPKG_TARGET_TRIPLET=wasm32-emscripten
fi

cmake --build "$build_dir" --parallel
