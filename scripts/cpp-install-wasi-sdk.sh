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
    cargo install wasm-tools
    cargo install --git https://github.com/bytecodealliance/wit-bindgen wit-bindgen-cli
    curl https://wasmtime.dev/install.sh -sSf | bash
    wget https://github.com/bytecodealliance/preview2-prototyping/releases/download/latest/wasi_snapshot_preview1.reactor.wasm
    mv ./wasi_snapshot_preview1.reactor.wasm ./wasi-sdk-${WASI_VERSION_FULL}/wasi_snapshot_preview1.wasm
fi
