project(test)

set(expat_DIR "${VCPKG_SHARE_DIR}/expat")
find_package(expat CONFIG REQUIRED)

add_definitions(-D_WASI_EMULATED_SIGNAL)
add_link_options(-lwasi-emulated-signal)

# set(CMAKE_CXX_STANDARD 20)
set(CMAKE_EXECUTABLE_SUFFIX ".wasm")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -nostartfiles -Wl,--no-entry -fno-exceptions --sysroot=${WASI_SDK_PREFIX}/share/wasi-sysroot")

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
    ${VCPKG_INCLUDE_DIR}/graphviz
)

add_executable(test
    main.cpp
    graphviz.cpp
    hw.c
    hw.h
)

target_link_libraries(test
    ${CMAKE_CURRENT_BINARY_DIR}/hw_component_type.o 
    expat::expat
    ${VCPKG_LIB_DIR}/libcommon.a
    ${VCPKG_LIB_DIR}/libgvc.a
    ${VCPKG_LIB_DIR}/libgvplugin_core.a
    ${VCPKG_LIB_DIR}/libgvplugin_dot_layout.a
    ${VCPKG_LIB_DIR}/libgvplugin_neato_layout.a
    ${VCPKG_LIB_DIR}/libortho.a
    ${VCPKG_LIB_DIR}/libcdt.a
    ${VCPKG_LIB_DIR}/libcgraph.a
    ${VCPKG_LIB_DIR}/libdotgen.a
    ${VCPKG_LIB_DIR}/libneatogen.a
    ${VCPKG_LIB_DIR}/libfdpgen.a
    ${VCPKG_LIB_DIR}/libsfdpgen.a
    ${VCPKG_LIB_DIR}/libtwopigen.a
    ${VCPKG_LIB_DIR}/libcircogen.a
    ${VCPKG_LIB_DIR}/liblabel.a
    ${VCPKG_LIB_DIR}/libosage.a
    ${VCPKG_LIB_DIR}/libpatchwork.a
    ${VCPKG_LIB_DIR}/libpack.a
    ${VCPKG_LIB_DIR}/libsparse.a
    ${VCPKG_LIB_DIR}/libpathplan.a
    ${VCPKG_LIB_DIR}/libxdot.a
)

add_custom_command(
    TARGET test POST_BUILD
    COMMAND wasm-tools component new ${CMAKE_CURRENT_BINARY_DIR}/test.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/test.component.wasm --adapt wasi_snapshot_preview1=${WASI_SDK_PREFIX}/wasi_snapshot_preview1.reactor.wasm
    COMMAND npx jco transpile ${CMAKE_CURRENT_BINARY_DIR}/test.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/js --wasi-shim --map wasi-*=@bytecodealliance/preview2-shim/* --map print=../../../../src-components/test/logger.js 
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/hw.c)
