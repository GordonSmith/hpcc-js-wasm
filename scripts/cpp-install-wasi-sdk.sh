#!/bin/bash

# List of current version can be found in https://github.com/WebAssembly/wasi-sdk/releases
# UPDATE README.md
VERSION=27
VERSION_FULL=27.0

# Detect OS and architecture
OS=$(uname -s)
ARCH=$(uname -m)

# Map OS and architecture to WASI SDK naming
case "$OS" in
    Linux)
        OS_NAME="linux"
        ;;
    Darwin)
        OS_NAME="macos"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        OS_NAME="mingw"
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

case "$ARCH" in
    x86_64|amd64)
        ARCH_NAME="x86_64"
        ;;
    aarch64|arm64)
        ARCH_NAME="arm64"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Construct download URL
PACKAGE_NAME="wasi-sdk-${VERSION_FULL}-${ARCH_NAME}-${OS_NAME}"
DOWNLOAD_URL="https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-${VERSION}/${PACKAGE_NAME}.tar.gz"

echo "Downloading WASI SDK ${VERSION_FULL} for ${OS_NAME} (${ARCH_NAME})..."
echo "URL: ${DOWNLOAD_URL}"

# Download and extract
if [ ! -d "./wasi-sdk" ]; then
    curl -L -o wasi-sdk.tar.gz "${DOWNLOAD_URL}"
    
    if [ $? -ne 0 ]; then
        echo "Failed to download WASI SDK"
        exit 1
    fi
    
    echo "Extracting WASI SDK..."
    tar -xzf wasi-sdk.tar.gz
    
    if [ $? -ne 0 ]; then
        echo "Failed to extract WASI SDK"
        exit 1
    fi
    
    # Rename to standard directory name
    mv "${PACKAGE_NAME}" wasi-sdk
    
    # Clean up
    rm wasi-sdk.tar.gz
    
    echo "WASI SDK ${VERSION_FULL} installed successfully to ./wasi-sdk"
else
    echo "WASI SDK directory already exists, skipping installation"
fi
