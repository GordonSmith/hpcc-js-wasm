#!/bin/bash

# List of current vertsion can be found in https://github.com/WebAssembly/wasi-sdk/releases  ---
WASI_VERSION=20
WASI_VERSION_FULL=${WASI_VERSION}.0
if [ ! -d "./wasi-sdk-${WASI_VERSION_FULL}" ] 
then
    curl --proto '=https' --tlsv1.3 https://sh.rustup.rs -sSf | sh -s -- -y
    wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_VERSION}/wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz
    tar xvf wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz
    rm wasi-sdk-${WASI_VERSION_FULL}-linux.tar.gz

    curl --proto '=https' --tlsv1.3 https://sh.rustup.rs -sSf | sh -s -- -y

    wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${WASI_VERSION}%2Bthreads/wasi-sdk-${WASI_VERSION_FULL}.threads-linux.tar.gz
        #  https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20%2Bthreads/wasi-sdk-20.0.threads-linux.tar.gz
    tar xvf wasi-sdk-${WASI_VERSION_FULL}.threads-linux.tar.gz
    rm wasi-sdk-${WASI_VERSION_FULL}.threads-linux.tar.gz
    rm -rf ./wasi-sdk-${WASI_VERSION_FULL}+threads/

    cargo install wasm-tools

    cargo install --git https://github.com/bytecodealliance/wit-bindgen wit-bindgen-cli

    curl https://wasmtime.dev/install.sh -sSf | bash

    wget https://github.com/bytecodealliance/preview2-prototyping/releases/download/latest/wasi_snapshot_preview1.command.wasm
    mv ./wasi_snapshot_preview1.command.wasm ./wasi-sdk-${WASI_VERSION_FULL}

    wget https://github.com/bytecodealliance/preview2-prototyping/releases/download/latest/wasi_snapshot_preview1.reactor.wasm
    mv ./wasi_snapshot_preview1.reactor.wasm ./wasi-sdk-${WASI_VERSION_FULL}
fi
