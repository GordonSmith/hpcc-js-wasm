project(utils)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wl,--import-memory,--export-memory,--max-memory=67108864 -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/host.wit
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/utils.c ${CMAKE_CURRENT_BINARY_DIR}/utils.h ${CMAKE_CURRENT_BINARY_DIR}/utils_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/host.wit
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/utils.c)
#  ---  ---  ---

include_directories(
    ${CMAKE_CURRENT_BINARY_DIR}
    ${VCPKG_INCLUDE_DIR}
)

add_executable(utils
    main.cpp
    utils.c
    utils.h
)

# target_compile_definitions(utils PUBLIC THREAD_MODEL=posix)

target_link_libraries(utils
    ${CMAKE_CURRENT_BINARY_DIR}/utils_component_type.o
    ${VCPKG_LIB_DIR}/libbase91.a
)

add_custom_command(
    TARGET utils POST_BUILD
    COMMAND wasm-tools component new ${CMAKE_CURRENT_BINARY_DIR}/utils.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/utils.component.wasm --adapt ${WASI_SDK_PREFIX}/wasi_snapshot_preview1.command.wasm -- --wasm-features=threads 
        # npx jco transpile ${CMAKE_CURRENT_BINARY_DIR}/utils.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/js --wasi-shim
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/utils.c)
