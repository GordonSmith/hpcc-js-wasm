#!/bin/bash

# List of current vertsion can be found in https://github.com/WebAssembly/wasi-sdk/releases  ---
WASI_VERSION=21
WASI_MINOR_VERSION=0
WASI_VERSION_FULL=${WASI_VERSION}.${WASI_MINOR_VERSION}
if [ ! -d "./wasi-sdk" ] 
then
    wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_VERSION}/wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz
    tar xvf wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz
    mv wasi-sdk-${WASI_VERSION_FULL} wasi-sdk
    rm wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz

    # wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_VERSION}%2Bthreads/wasi-sdk-${WASI_VERSION_FULL}.threads-linux.tar.gz
    # tar xvf wasi-sdk-${WASI_VERSION_FULL}.threads-linux.tar.gz
    # rm wasi-sdk-${WASI_VERSION_FULL}.threads-linux.tar.gz
fi
