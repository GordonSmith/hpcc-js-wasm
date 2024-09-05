project(usearchlib)

find_package(usearch CONFIG REQUIRED)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/build")
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/build")
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/build")

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js

set(EM_CPP_FLAGS 
    ${EM_CPP_FLAGS}
    "-pthread"
)
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-s EXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    "-s EXPORTED_FUNCTIONS=\"[]\""
    "-s EXPORTED_RUNTIME_METHODS=\"['UTF8ToString']\""
    "-s WASM_BIGINT"
    "-s ENVIRONMENT=node"
    "-pthread"
    "-s PTHREAD_POOL_SIZE=4"
    "-lembind"
    "--emit-tsd ${CMAKE_CURRENT_SOURCE_DIR}/build/usearchlib.wasm.d.ts"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${usearch_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/build
)

add_executable(usearchlib
    src-cpp/main.cpp
)

set_target_properties(usearchlib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(usearchlib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(usearchlib
    PRIVATE usearch::usearch
)

