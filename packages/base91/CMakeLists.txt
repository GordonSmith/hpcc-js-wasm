project(base91lib)

find_package(unofficial-base91 CONFIG REQUIRED)

#  Generate C bindings from WIT file  ---
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/wit/base91.wit --out-dir ${CMAKE_CURRENT_BINARY_DIR}
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/wit/base91.wit
    COMMENT "Generating C bindings from WIT file"
    VERBATIM
)

add_custom_target(generate_bindings
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
)
#  ---  ---  ---

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(base91lib
    src-cpp/main.cpp
    ${CMAKE_CURRENT_BINARY_DIR}/root.c
    ${CMAKE_CURRENT_BINARY_DIR}/root.h
)

add_dependencies(base91lib generate_bindings)

set_target_properties(base91lib PROPERTIES 
    OUTPUT_NAME "base91lib"
    SUFFIX ".wasm"
)
# set_target_properties(base91lib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
# set_target_properties(base91lib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(base91lib PRIVATE
    ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    unofficial::base91::base91
)

#  Generate WASM Component from core module  ---
add_custom_command(
    TARGET base91lib POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E echo "Creating WASM component from core module..."
    COMMAND wasm-tools component new $<TARGET_FILE:base91lib> --adapt ${CMAKE_SOURCE_DIR}/wasi-sdk/share/wasi_snapshot_preview1.reactor.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/base91lib.component.wasm
    COMMAND ${CMAKE_COMMAND} -E echo "Transpiling component to JavaScript..."
    COMMAND npx jco transpile -b 10000000 --no-nodejs-compat ${CMAKE_CURRENT_BINARY_DIR}/base91lib.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}
    COMMENT "Creating and transpiling WASM component"
    VERBATIM
)
