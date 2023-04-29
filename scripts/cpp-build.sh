#!/bin/bash

if [ ! -d "./build" ] 
then
    mkdir -p build
    cmake -S . -B ./build -G "Ninja" -DCMAKE_BUILD_TYPE=MinSizeRel
fi

mkdir -p ./lib-esm
cd ./build
cmake --build . --parallel
cd ..
