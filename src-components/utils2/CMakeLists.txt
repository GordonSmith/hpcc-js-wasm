project(utils2)

# set(triple wasm32-wasi-threads)
# set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -pthread")
# set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -pthread")

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} --target=wasm32-wasi-threads -Wl,--import-memory,--export-memory -fno-exceptions -mexec-model=reactor --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/host.wit
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/utils2.c ${CMAKE_CURRENT_BINARY_DIR}/utils2.h ${CMAKE_CURRENT_BINARY_DIR}/utils2_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/host.wit
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/utils2.c)
#  ---  ---  ---

include_directories(
    ${CMAKE_CURRENT_BINARY_DIR}
    ${VCPKG_INCLUDE_DIR}
)

add_executable(utils2
    main.cpp
    utils2.c
    utils2.h
)

target_link_libraries(utils2
    ${CMAKE_CURRENT_BINARY_DIR}/utils2_component_type.o
    ${VCPKG_LIB_DIR}/libbase91.a
)

add_custom_command(
    TARGET utils2 POST_BUILD
    COMMAND 
        wasm-tools component new ${CMAKE_CURRENT_BINARY_DIR}/utils2.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/utils2.component.wasm --adapt ${WASI_SDK_PREFIX}/wasi_snapshot_preview1.reactor.wasm && 
        npx jco transpile ${CMAKE_CURRENT_BINARY_DIR}/utils2.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/js --wasi-shim
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/utils2.c)
