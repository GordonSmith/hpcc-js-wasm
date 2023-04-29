project(utils)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/host.wit
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/utils.c ${CMAKE_CURRENT_BINARY_DIR}/utils.h ${CMAKE_CURRENT_BINARY_DIR}/utils_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/host.wit
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/utils.c)
#  ---  ---  ---

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
    ${REPO_DIR}/vcpkg_installed/wasm32-emscripten/include
)

add_executable(utils
    main.cpp
    utils.c
    utils.h
)

target_link_libraries(utils
    ${CMAKE_CURRENT_BINARY_DIR}/utils_component_type.o
    ${REPO_DIR}/vcpkg_installed/wasm32-emscripten/lib/libbase91.a
)

add_custom_command(
    TARGET utils POST_BUILD
    COMMAND 
        wasm-tools component new ${CMAKE_CURRENT_BINARY_DIR}/utils.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/utils.component.wasm --adapt ${WASI_SDK_PREFIX}/wasi_snapshot_preview1.wasm && 
        npx jco transpile ${CMAKE_CURRENT_BINARY_DIR}/utils.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/js --map '*=@bytecodealliance/preview2-shim/*'
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/utils.c)
