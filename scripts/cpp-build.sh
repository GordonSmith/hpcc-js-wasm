#!/bin/bash

source ./emsdk/emsdk_env.sh

if [ ! -d "./build" ] 
then
    mkdir build
    cd ./build
    cmake .. -DCMAKE_TOOLCHAIN_FILE=../vcpkg/scripts/buildsystems/vcpkg.cmake -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=./emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake -DCMAKE_BUILD_TYPE=MinSizeRel -DVCPKG_MANIFEST_DIR=.. -DVCPKG_OVERLAY_PORTS=../vcpkg-overlays -DVCPKG_TARGET_TRIPLET=wasm32-emscripten
    cd ..
fi

cd ./build
cmake .. -DCMAKE_TOOLCHAIN_FILE=../vcpkg/scripts/buildsystems/vcpkg.cmake -DVCPKG_CHAINLOAD_TOOLCHAIN_FILE=./emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake -DCMAKE_BUILD_TYPE=Debug -DVCPKG_MANIFEST_DIR=.. -DVCPKG_OVERLAY_PORTS=../vcpkg-overlays -DVCPKG_TARGET_TRIPLET=wasm32-emscripten
cmake --build . --target install -- -j
cd ..
