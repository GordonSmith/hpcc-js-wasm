cmake_minimum_required(VERSION 3.9.2)

cmake_path(GET CMAKE_CURRENT_SOURCE_DIR PARENT_PATH REPO_DIR)
set(CMAKE_TOOLCHAIN_FILE ${REPO_DIR}/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake)

project(cpp)

option(ENABLE_SANITIZERS "Enable Clang's sanitizer options" OFF)

set(CMAKE_INSTALL_PREFIX "..")

set(VCPKG_ROOT ${REPO_DIR}/vcpkg)
set(VCPKG_TARGET_TRIPLET wasm32-emscripten)
set(VCPKG_INSTALLED_DIR ${VCPKG_ROOT}/vcpkg-installed_wasm/${VCPKG_TARGET_TRIPLET})
set(VCPKG_INCLUDE_DIR ${VCPKG_INSTALLED_DIR}/include)
set(VCPKG_LIB_DIR ${VCPKG_INSTALLED_DIR}/lib)
set(VCPKG_SHARE_DIR ${VCPKG_INSTALLED_DIR}/share)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
set(EM_CPP_FLAGS "")

set(EM_LINK_FLAGS 
    "-sASSERTIONS=0"
    "-sINVOKE_RUN=0"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sWASM=1"
    "-sENVIRONMENT=webview"
    "-sFILESYSTEM=0"
    # "-sMINIMAL_RUNTIME=1"
    "-sMODULARIZE=1" 
    "-sEXPORT_ES6=1"
    "-sIGNORE_CLOSURE_COMPILER_ERRORS=0"
    # "-sWASM_BIGINT=1"
    "-sSTANDALONE_WASM=0"
    "-sBINARYEN_ASYNC_COMPILATION=1"
    # "-sDYNAMIC_EXECUTION=0"
    "--pre-js ${REPO_DIR}/src-cpp/src/pre.js"
    "--post-js ${REPO_DIR}/src-cpp/src/post.js"
)

if (CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(EM_LINK_FLAGS 
        ${EM_LINK_FLAGS}
        "-sUSE_ES6_IMPORT_META=1"
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
            "-sENVIRONMENT=web,node"
        )
    endif ()
else ()
    set(EM_LINK_FLAGS 
        ${EM_LINK_FLAGS}
        "-sUSE_ES6_IMPORT_META=0"
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

function(packWasm targetID)
    add_custom_target(sfx-${targetID} ALL
        COMMAND node ./utils/sfx-wasm.js ${PACK_MODE} ${CMAKE_CURRENT_BINARY_DIR}/${targetID}.wasm > ${REPO_DIR}/lib-esm/${targetID}.wasm.js
        WORKING_DIRECTORY ${REPO_DIR}
        COMMENT "SFX Wasm ${targetID}"
    ) 

    add_dependencies(sfx-${targetID} ${targetID} base91lib zstdlib)
endfunction ()

add_subdirectory(base91)
add_subdirectory(expat)
add_subdirectory(graphviz)
add_subdirectory(test)
add_subdirectory(zstd)
