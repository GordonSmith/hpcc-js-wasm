project(zstd)

set(zstd_DIR "${VCPKG_SHARE_DIR}/zstd")
find_package(zstd CONFIG REQUIRED)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/guest.wit
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/guest.c ${CMAKE_CURRENT_BINARY_DIR}/guest.h ${CMAKE_CURRENT_BINARY_DIR}/guest_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/guest.wit
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/guest.c)
#  ---  ---  ---

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(zstd
    main.cpp
    # guest.c
    # guest.h
)

target_link_libraries(zstd
    PRIVATE $<IF:$<TARGET_EXISTS:zstd::libzstd_shared>,zstd::libzstd_shared,zstd::libzstd_static>
)

# add_custom_command(
#     TARGET zstd POST_BUILD
#     COMMAND 
#         wasm-tools component new ${CMAKE_CURRENT_BINARY_DIR}/zstd.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/zstd.component.wasm --adapt ${WASI_SDK_PREFIX}/wasi_snapshot_preview1.command.wasm && 
#         # npx jco transpile ${CMAKE_CURRENT_BINARY_DIR}/utils.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/js --wasi-shim
# )
# set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/guest.c)
