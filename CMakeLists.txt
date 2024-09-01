cmake_minimum_required(VERSION 3.10)

project(cpp)

option(ENABLE_SANITIZERS "Enable Clang's sanitizer options" OFF)

set(CMAKE_INSTALL_PREFIX "..")
set(VCPKG_INCLUDE_DIR ${VCPKG_INSTALLED_DIR}/${VCPKG_TARGET_TRIPLET}/include)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
set(EM_CPP_FLAGS 
    "-flto"
)

set(EM_LINK_FLAGS 
    "-s ASSERTIONS=0"
    "-s INVOKE_RUN=0"
    "-s ALLOW_MEMORY_GROWTH=1"
    # "-s WASM=1"
    "-s ENVIRONMENT=webview"
    "-s FILESYSTEM=0"
    "-s MINIMAL_RUNTIME=2"
    "-s MODULARIZE=1" 
    "-s EXPORT_ES6=1"
    # "-s IGNORE_CLOSURE_COMPILER_ERRORS=0"
    # "-s WASM_BIGINT=1"
    # "-s STANDALONE_WASM=0"
    # "-s BINARYEN_ASYNC_COMPILATION=1"
    # "-s DYNAMIC_EXECUTION=0"
    "-s POLYFILL=0"
    # "-s STRICT=0"
    "-s IGNORE_MISSING_MAIN=0"
    "-s AUTO_JS_LIBRARIES=0"
    "-s AUTO_NATIVE_LIBRARIES=0"
    "-s AUTO_ARCHIVE_INDEXES=0"
    "-s DEFAULT_TO_CXX=0"
    "-s USE_GLFW=0"
    "-s ALLOW_UNIMPLEMENTED_SYSCALLS=1"
    "-s INCOMING_MODULE_JS_API=\"['wasmBinary']\""
    "--no-entry"
    "--pre-js ${CMAKE_CURRENT_SOURCE_DIR}/src-cpp/src/pre.js"
    "--post-js ${CMAKE_CURRENT_SOURCE_DIR}/src-cpp/src/post.js"
)

if (CMAKE_BUILD_TYPE STREQUAL "Debug" OR CMAKE_BUILD_TYPE STREQUAL "RelWithDebInfo")
    set(EM_LINK_FLAGS 
        ${EM_LINK_FLAGS}
        "-s USE_ES6_IMPORT_META=1"
        "-gsource-map"
        "--source-map-base ./"  #  Debugging c++ only works in browser with "Experimental DWARF support turned on"
    )

    if (ENABLE_SANITIZERS)
        set(EM_CPP_FLAGS 
            ${EM_CPP_FLAGS}
            "-fsanitize=address"
        )

        set(EM_LINK_FLAGS 
            ${EM_LINK_FLAGS}
            "-fsanitize=address"
            "-s ENVIRONMENT=web,node"
        )
    endif ()
else ()
    set(EM_LINK_FLAGS 
        ${EM_LINK_FLAGS}
        "-s USE_ES6_IMPORT_META=0"
    )
endif ()

set(EMSDK_DIR "${CMAKE_SOURCE_DIR}/emsdk")
set(EXPAT_DIR "${CMAKE_SOURCE_DIR}/src-expat/expat")
set(GRAPHVIZ_DIR "${CMAKE_SOURCE_DIR}/third-party/graphviz")

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(PACK_MODE "")
if (CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(PACK_MODE "-d")
endif ()

add_subdirectory(packages/base91)
add_subdirectory(packages/expat/src-cpp)
add_subdirectory(packages/graphviz/src-cpp)
add_subdirectory(packages/llama/src-cpp)
add_subdirectory(packages/zstd/src-cpp)
