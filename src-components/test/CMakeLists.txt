project(test)

# set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fno-exceptions -mexec-model=reactor --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/hw.wit
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/hw.c ${CMAKE_CURRENT_BINARY_DIR}/hw.h ${CMAKE_CURRENT_BINARY_DIR}/hw_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/hw.wit
    COMMAND wit-bindgen markdown ${CMAKE_CURRENT_SOURCE_DIR}/hw.wit
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/hw.c)
#  ---  ---  ---

include_directories(
    ${CMAKE_CURRENT_BINARY_DIR}
    ${VCPKG_INCLUDE_DIR}
)

add_executable(test
    main.cpp
    hw.c
    hw.h
)

target_link_libraries(test
    ${CMAKE_CURRENT_BINARY_DIR}/hw_component_type.o
)

add_custom_command(
    TARGET test POST_BUILD
    COMMAND wasm-tools component new ${CMAKE_CURRENT_BINARY_DIR}/test.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/test.component.wasm --adapt ${WASI_SDK_PREFIX}/wasi_snapshot_preview1.reactor.wasm
    COMMAND npx jco transpile ${CMAKE_CURRENT_BINARY_DIR}/test.component.wasm --map print=/src-components/test/logger.js -o ${CMAKE_CURRENT_BINARY_DIR}/js --wasi-shim
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/hw.c)
