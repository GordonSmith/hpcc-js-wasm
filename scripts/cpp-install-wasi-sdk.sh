#!/bin/bash

# List of current vertsion can be found in https://github.com/emscripten-core/emsdk/tags  ---
# UPDATE README.md
export WASI_VERSION=14
export WASI_VERSION_FULL=${WASI_VERSION}.0

if [ ! -d "./wasi-sdk" ] 
then
    git clone https://github.com/emscripten-core/emsdk.git
fi
cd ./emsdk
git fetch
git pull
./emsdk install $VERSION-upstream
./emsdk activate $VERSION-upstream
cd ..
