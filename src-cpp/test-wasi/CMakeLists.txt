project(test_wasi)

# find and link libraries
find_path(Graphviz_INCLUDE_DIRS NAMES graphviz/gvc.h HINTS "${REPO_DIR}/vcpkg/vcpkg-installed_wasm/wasm32-emscripten/include" REQUIRED)

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

wit2code(test_wasi)

set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_SHARED_LIBRARY_SUFFIX ".wasm")

# set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -nostartfiles -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")
# set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,--no-entry -Wl,--export-all")

set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -D_WASI_EMULATED_SIGNAL --target=wasm32-unknown-wasi -nostartfiles -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot -Wl,--no-entry")
set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -lwasi-emulated-signal")

include_directories(
    ${Graphviz_INCLUDE_DIRS}/graphviz
    ${CMAKE_CURRENT_BINARY_DIR}/test_wasi/cpp
)

add_executable(test_wasi
    main.cpp
    ${CMAKE_CURRENT_BINARY_DIR}/test_wasi/cpp/test_wasi.c
)

target_link_libraries(test_wasi
    ${CMAKE_CURRENT_BINARY_DIR}/test_wasi/cpp/test_wasi_component_type.o
)

add_custom_command(
    TARGET test_wasi POST_BUILD
    COMMAND wasm-tools component new ${CMAKE_CURRENT_BINARY_DIR}/test_wasi.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/test_wasi.component.wasm --adapt wasi_snapshot_preview1=${REPO_DIR}/wit-bindgen/wasi_snapshot_preview1.reactor.wasm
    COMMAND npx -y jco transpile ${CMAKE_CURRENT_BINARY_DIR}/test_wasi.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/js #--wasi-shim --map wasi-*=@bytecodealliance/preview2-shim/* --map print=../../../../src-components/test_wasi/logger.js 
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/test_wasi/cpp/test_wasi.c)

# Install the target and export the target information
install(TARGETS test_wasi
    EXPORT addConfig
    RUNTIME DESTINATION bin
)

# Export the target information to a file
install(EXPORT addConfig
    FILE addConfig.cmake
    NAMESPACE test_wasi::
    DESTINATION lib/cmake/test_wasi
)
