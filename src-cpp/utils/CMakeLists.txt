project(utils)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/host.wit
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/utils.c ${CMAKE_CURRENT_BINARY_DIR}/utils.h ${CMAKE_CURRENT_BINARY_DIR}/utils_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/host.wit
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/utils.c)
#  ---  ---  ---

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(utils
    main.cpp
    utils.h
    utils.c
)

target_link_libraries(utils
    ${CMAKE_CURRENT_BINARY_DIR}/utils_component_type.o
)

