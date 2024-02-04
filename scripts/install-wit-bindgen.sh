#!/bin/bash

# List of current vertsion can be found in https://github.com/bytecodealliance/wit-bindgen/releases  ---
VERSION=0.16.0

# List of current vertsion can be found in https://github.com/bytecodealliance/wasmtime/releases
WASMTIME_VERSION=17.0.0

if [ ! -d "./wit-bindgen" ] 
then
    mkdir wit-bindgen

    curl --proto '=https' --tlsv1.3 https://sh.rustup.rs -sSf | sh -s -- -y
    cargo install wasm-tools

    cargo install --git https://github.com/bytecodealliance/wit-bindgen --tag wit-bindgen-cli-$VERSION wit-bindgen-cli

    curl https://wasmtime.dev/install.sh -sSf | bash

    wget https://github.com/bytecodealliance/wasmtime/releases/download/v$WASMTIME_VERSION/wasi_snapshot_preview1.command.wasm
    mv ./wasi_snapshot_preview1.command.wasm ./wit-bindgen

    wget https://github.com/bytecodealliance/wasmtime/releases/download/v$WASMTIME_VERSION/wasi_snapshot_preview1.reactor.wasm
    mv ./wasi_snapshot_preview1.reactor.wasm ./wit-bindgen

    wget https://github.com/bytecodealliance/wasmtime/releases/download/v$WASMTIME_VERSION/wasi_snapshot_preview1.proxy.wasm
    mv ./wasi_snapshot_preview1.proxy.wasm ./wit-bindgen
fi
