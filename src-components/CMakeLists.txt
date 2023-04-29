cmake_minimum_required(VERSION 3.24)

# cmake_minimum_required(VERSION 3.9.2)

set(REPO_DIR ${CMAKE_CURRENT_SOURCE_DIR}/..)
# set(VCPKG_FILES_DIR "${CMAKE_BINARY_DIR}" CACHE STRING "Folder for vcpkg download, build and installed files")
# set(CMAKE_TOOLCHAIN_FILE ${REPO_DIR}/vcpkg/scripts/buildsystems/vcpkg.cmake)
# set(VCPKG_CHAINLOAD_TOOLCHAIN_FILE ${REPO_DIR}/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake)
# set(VCPKG_ROOT ${REPO_DIR}/vcpkg)
# set(VCPKG_OVERLAY_PORTS ${CMAKE_CURRENT_SOURCE_DIR}/vcpkg-overlays)
# set(VCPKG_TARGET_TRIPLET "wasm32-emscripten")
# file(REMOVE ${REPO_DIR}/vcpkg/vcpkg)

set(WASI_SDK_PREFIX ${REPO_DIR}/wasi-sdk-20.0)
set(CMAKE_TOOLCHAIN_FILE "${WASI_SDK_PREFIX}/share/cmake/wasi-sdk.cmake")

project(components C CXX)

# add_subdirectory(base91)
# add_subdirectory(expat)
# add_subdirectory(graphviz)
# add_subdirectory(zstd)
add_subdirectory(utils)
