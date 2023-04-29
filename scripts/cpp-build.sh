#!/bin/bash

# source ./emsdk/emsdk_env.sh
if [ ! -d "./build" ] 
then
    mkdir -p build
    cmake -S . -B ./build -G "Ninja"
fi

mkdir -p ./lib-esm
cd ./build
cmake --build . --parallel
cd ..
