project(zstdlib)

find_package(zstd CONFIG REQUIRED)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
set(EM_CPP_FLAGS

)
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS
    "-sPURE_WASI=1"
    "-sSTANDALONE_WASM=1"
    "--no-entry"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

#  Generate C bindings from WIT file  --- 
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/wit/zstd.wit --out-dir ${CMAKE_CURRENT_BINARY_DIR}
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/wit/zstd.wit
    COMMENT "Generating C bindings from WIT file"
    VERBATIM
)

add_custom_target(generate_zstd_bindings
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
)
#  ---  ---  ---

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(zstdlib
    src-cpp/main.cpp
    ${CMAKE_CURRENT_BINARY_DIR}/root.c
    ${CMAKE_CURRENT_BINARY_DIR}/root.h
)

add_dependencies(zstdlib generate_zstd_bindings)

set_target_properties(zstdlib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(zstdlib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(zstdlib PRIVATE
    ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    $<IF:$<TARGET_EXISTS:zstd::libzstd_shared>,zstd::libzstd_shared,zstd::libzstd_static>
)

set_target_properties(zstdlib PROPERTIES 
    OUTPUT_NAME "zstdlib"
    SUFFIX ".wasm"
)

#  Generate WASM Component from core module  ---
add_custom_command(
    TARGET zstdlib POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E echo "Creating WASM component from core module..."
    COMMAND wasm-tools component new $<TARGET_FILE:zstdlib> --adapt ${CMAKE_SOURCE_DIR}/node_modules/@bytecodealliance/jco/lib/wasi_snapshot_preview1.reactor.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/zstdlib.component.wasm
    COMMAND ${CMAKE_COMMAND} -E echo "Transpiling component to JavaScript..."
    COMMAND npx jco transpile -b 10000000 --no-nodejs-compat ${CMAKE_CURRENT_BINARY_DIR}/zstdlib.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}
    COMMENT "Creating and transpiling WASM component"
    VERBATIM
)
