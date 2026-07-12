project(base91lib)

find_package(unofficial-base91 CONFIG REQUIRED)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
set(EM_CPP_FLAGS 
    ${EM_CPP_FLAGS}
    "-fwasm-exceptions"
)
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-sEXPORT_NAME='${CMAKE_PROJECT_NAME}'"

    "-fwasm-exceptions"
    "-sEXCEPTION_STACK_TRACES=1"
    "--emit-tsd ${CMAKE_CURRENT_BINARY_DIR}/base91lib.d.ts"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

include_directories(
    ${VCPKG_INCLUDE_DIR}
)

add_executable(base91lib
    src-cpp/main.cpp
)

set_target_properties(base91lib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(base91lib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(base91lib
    unofficial::base91::base91
)

# Copy generated files to source directories
add_custom_command(TARGET base91lib POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
        ${CMAKE_CURRENT_BINARY_DIR}/base91lib.d.ts
        ${CMAKE_CURRENT_SOURCE_DIR}/types/base91lib.d.ts
    COMMENT "Copying generated base91lib files to source directories"
)

# ---------------------------------------------------------------------------
# Java / JVM target — standalone WASI WebAssembly, no JavaScript runtime needed
# ---------------------------------------------------------------------------
# Deliberately uses only the root EM_CPP_FLAGS (no embind, no exceptions).
string(REPLACE ";" " " JAVA_CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_JAVA_LINK_FLAGS
    "--standalone-wasm"
    "--no-entry"
    "-sEXPORTED_FUNCTIONS=['_base91_malloc','_base91_free','_base91_encode','_base91_decode','_base91_version']"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sASSERTIONS=0"
)
string(REPLACE ";" " " JAVA_LINK_FLAGS "${EM_JAVA_LINK_FLAGS}")

add_executable(base91lib_java
    src-cpp/java_bridge.cpp
)

set_target_properties(base91lib_java PROPERTIES
    COMPILE_FLAGS "${JAVA_CPP_FLAGS}"
    LINK_FLAGS    "${JAVA_LINK_FLAGS}"
    SUFFIX        ".wasm"
)

target_link_libraries(base91lib_java
    unofficial::base91::base91
)

# Copy the WASI WASM to the Java package resources so it is bundled in the JAR
add_custom_command(TARGET base91lib_java POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E make_directory
        ${CMAKE_CURRENT_SOURCE_DIR}/../../packages-java/base91/src/main/resources
    COMMAND ${CMAKE_COMMAND} -E copy
        ${CMAKE_CURRENT_BINARY_DIR}/base91lib_java.wasm
        ${CMAKE_CURRENT_SOURCE_DIR}/../../packages-java/base91/src/main/resources/base91lib.wasm
    COMMENT "Copying WASI WASM to Java package resources"
)
