#!/bin/bash

source ./emsdk/emsdk_env.sh
if [ ! -d "./build" ] 
then
    mkdir -p build
    cmake -S . -B ./build -G "Ninja" -DCMAKE_BUILD_TYPE=MinSizeRel
    ./vcpkg/vcpkg install --overlay-ports=./vcpkg-overlays --triplet=wasm32-emscripten
fi

mkdir -p ./lib-esm
cd ./build
cmake --build . --parallel
cd ..
