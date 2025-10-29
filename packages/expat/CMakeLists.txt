project(expatlib)

find_package(expat CONFIG REQUIRED)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
set(CPP_FLAGS

)
string(REPLACE ";" " " CPP_FLAGS "${CPP_FLAGS}")

set(LINK_FLAGS
    "-sPURE_WASI=1"
    "-sSTANDALONE_WASM=1"
    "--no-entry"
)
string(REPLACE ";" " " LINK_FLAGS "${LINK_FLAGS}")

#  Generate C bindings from WIT file  --- 
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/wit/expat.wit --out-dir ${CMAKE_CURRENT_BINARY_DIR}
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/wit/expat.wit
    COMMENT "Generating C bindings from WIT file"
    VERBATIM
)

add_custom_target(generate_expat_bindings
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
)
#  ---  ---  ---

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(expatlib
    src-cpp/main.cpp
    ${CMAKE_CURRENT_BINARY_DIR}/root.c
    ${CMAKE_CURRENT_BINARY_DIR}/root.h
)

add_dependencies(expatlib generate_expat_bindings)

set_target_properties(expatlib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(expatlib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(expatlib
    ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    expat::expat
)

set_target_properties(expatlib PROPERTIES 
    OUTPUT_NAME "expatlib"
    SUFFIX ".wasm"
)

# target_compile_definitions(expatlib PRIVATE _WASI_EMULATED_GETPID)

# # set_target_properties(base91lib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
# # set_target_properties(base91lib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

# target_link_libraries(expatlib PRIVATE
#     ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
#     expat::expat
#     wasi-emulated-getpid
# )

#  Generate WASM Component from core module  ---
add_custom_command(
    TARGET expatlib POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E echo "Creating WASM component from core module..."
    COMMAND wasm-tools component new $<TARGET_FILE:expatlib> --adapt ${CMAKE_SOURCE_DIR}/node_modules/@bytecodealliance/jco/lib/wasi_snapshot_preview1.reactor.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/expatlib.component.wasm
    COMMAND ${CMAKE_COMMAND} -E echo "Transpiling component to JavaScript..."
    COMMAND npx jco transpile -b 10000000 --no-nodejs-compat ${CMAKE_CURRENT_BINARY_DIR}/expatlib.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}
    COMMENT "Creating and transpiling WASM component"
    VERBATIM
)
