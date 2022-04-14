#!/bin/bash

source ./emsdk/emsdk_env.sh

if [ ! -d "./build" ] 
then
    mkdir build
    cd ./build
    cmake ../cpp -DCMAKE_TOOLCHAIN_FILE=../vcpkg/scripts/buildsystems/vcpkg.cmake -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=../emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake -DCMAKE_BUILD_TYPE=MinSizeRel -DVCPKG_MANIFEST_DIR=.. -DVCPKG_OVERLAY_PORTS=../cpp/overlay-ports -DVCPKG_TARGET_TRIPLET=wasm32-emscripten
    cd ..
fi

# cmake ../cpp -DCMAKE_TOOLCHAIN_FILE=../vcpkg/scripts/buildsystems/vcpkg.cmake -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=../emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake -DCMAKE_BUILD_TYPE=Debug -DVCPKG_MANIFEST_DIR=.. -DVCPKG_OVERLAY_PORTS=../cpp/overlay-ports -DVCPKG_TARGET_TRIPLET=wasm32-emscripten
cd ./build
cmake --build . --target install -- -j
cd ..
