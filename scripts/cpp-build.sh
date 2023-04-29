#!/bin/bash

if [ ! -d "./build/src-components" ] 
then
    mkdir -p build/src-components
    cmake -S ./src-components -B ./build/src-components -G "Ninja" -DCMAKE_BUILD_TYPE=MinSizeRel
fi

cmake --build ./build/src-components --parallel

source ./emsdk/emsdk_env.sh
if [ ! -d "./build/src-cpp" ] 
then
    mkdir -p build/src-cpp
    cmake -S ./src-cpp -B ./build/src-cpp -DCMAKE_BUILD_TYPE=MinSizeRel
fi

mkdir -p ./lib-esm
cmake --build ./build/src-cpp -- -j

