project(base91lib)

find_package(unofficial-base91 CONFIG REQUIRED)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
set(EM_CPP_FLAGS
    ${EM_CPP_FLAGS}
)
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS
    ${EM_LINK_FLAGS}
    "-sMODULARIZE=0" 
    "-sEXPORT_ES6=0"
    "-sPURE_WASI=1"
    "-sSTANDALONE_WASM=1"
    "--no-entry"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

#  Generate C bindings from WIT file  --- 
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/wit/base91.wit --out-dir ${CMAKE_CURRENT_BINARY_DIR}
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/wit/base91.wit
    COMMENT "Generating C bindings from WIT file"
    VERBATIM
)

add_custom_target(generate_${PROJECT_NAME}_bindings
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
)
#  ---  ---  ---

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(${PROJECT_NAME}
    src-cpp/main.cpp
    ${CMAKE_CURRENT_BINARY_DIR}/root.c
    ${CMAKE_CURRENT_BINARY_DIR}/root.h
)

add_dependencies(${PROJECT_NAME} generate_${PROJECT_NAME}_bindings)

set_target_properties(${PROJECT_NAME} PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(${PROJECT_NAME} PROPERTIES LINK_FLAGS "${LINK_FLAGS}")
set_target_properties(${PROJECT_NAME} PROPERTIES OUTPUT_NAME "${PROJECT_NAME}" SUFFIX ".wasm")

target_link_libraries(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    unofficial::base91::base91
)

#  Generate WASM Component from core module  ---
add_custom_command(
    TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E echo "Creating WASM component from core module..."
    COMMAND wasm-tools component new $<TARGET_FILE:${PROJECT_NAME}> --adapt ${CMAKE_SOURCE_DIR}/node_modules/@bytecodealliance/jco/lib/wasi_snapshot_preview1.reactor.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.component.wasm
    COMMAND ${CMAKE_COMMAND} -E echo "Transpiling component to JavaScript..."
    COMMAND npx jco transpile -b 10000000 --no-nodejs-compat ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}
    COMMENT "Creating and transpiling WASM component"
    VERBATIM
)
