project(test)

function(wit2code witFile)
    add_custom_command(
        MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/${witFile}.wit
        OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/${witFile}/cpp/${witFile}.c ${CMAKE_CURRENT_BINARY_DIR}/${witFile}/cpp/${witFile}.h ${CMAKE_CURRENT_BINARY_DIR}/${witFile}/cpp/${witFile}_component_type.o
        # COMMAND wit-bindgen markdown ${CMAKE_CURRENT_SOURCE_DIR}/${witFile}.wit
        COMMAND wit-bindgen c --out-dir ${CMAKE_CURRENT_BINARY_DIR}/${witFile}/cpp ${CMAKE_CURRENT_SOURCE_DIR}/${witFile}.wit
        # COMMAND wit-bindgen rust --ownership owning --out-dir ${CMAKE_CURRENT_BINARY_DIR}/${witFile}/rust ${CMAKE_CURRENT_SOURCE_DIR}/${witFile}.wit
        # COMMAND wit-bindgen teavm-java --out-dir ${CMAKE_CURRENT_BINARY_DIR}/${witFile}/java ${CMAKE_CURRENT_SOURCE_DIR}/${witFile}.wit
        # COMMAND wit-bindgen tiny-go --out-dir ${CMAKE_CURRENT_BINARY_DIR}/${witFile}/go ${CMAKE_CURRENT_SOURCE_DIR}/${witFile}.wit
    )
    add_custom_target(wit-generate-${witFile} ALL DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/${witFile}/cpp/${witFile}.c)
endfunction()

wit2code(test)

set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_SHARED_LIBRARY_SUFFIX ".wasm")

# set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -nostartfiles -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")
# set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,--no-entry -Wl,--export-all")

set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -nostartfiles -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot -Wl,--no-entry")

include_directories(
    ${CMAKE_CURRENT_BINARY_DIR}/test/cpp
)

add_executable(add
    main.cpp
    ${CMAKE_CURRENT_BINARY_DIR}/test/cpp/test.c
)

target_link_libraries(add
    ${CMAKE_CURRENT_BINARY_DIR}/test/cpp/test_component_type.o
)

# add_custom_command(
#     TARGET add POST_BUILD
#     COMMAND wasm-tools component new ${CMAKE_CURRENT_BINARY_DIR}/add.wasm -o ${HPCC_WASM_ROOT}/build/guest/cpp/bin/add.component.wasm --adapt wasi_snapshot_preview1=${HPCC_WASM_ROOT}/wit-bindgen/wasi_preview1_component_adapter.reactor.wasm
#     # COMMAND npx jco transpile ${CMAKE_CURRENT_BINARY_DIR}/test.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/js --wasi-shim --map wasi-*=@bytecodealliance/preview2-shim/* --map print=../../../../src-components/test/logger.js 
# )
# set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${HPCC_WASM_ROOT}/build/guest/cpp/wit/test.c)

# Install the target and export the target information
install(TARGETS add
    EXPORT addConfig
    RUNTIME DESTINATION bin
)

# Export the target information to a file
install(EXPORT addConfig
    FILE addConfig.cmake
    NAMESPACE add::
    DESTINATION lib/cmake/add
)
