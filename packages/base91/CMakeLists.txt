project(base91lib)

find_package(unofficial-base91 CONFIG REQUIRED)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/build")
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/build")
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/build")

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js

set(EM_CPP_FLAGS 
    ${EM_CPP_FLAGS}
)
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-s EXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    "-s EXPORTED_FUNCTIONS=\"[]\""
    "-s EXPORTED_RUNTIME_METHODS=\"[UTF8ToString]\""
    "--post-js ${CMAKE_CURRENT_SOURCE_DIR}/build/main_glue.js"
    "--emit-tsd ${CMAKE_CURRENT_SOURCE_DIR}/build/base91lib.wasm.d.ts"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

#  Generate Glue from IDL file  ---
add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/src-cpp/main.idl
    OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/build/main_glue.js ${CMAKE_CURRENT_SOURCE_DIR}/build/main_glue.cpp
    COMMAND python3 ${CMAKE_BINARY_DIR}/../emsdk/upstream/emscripten/tools/webidl_binder.py ${CMAKE_CURRENT_SOURCE_DIR}/src-cpp/main.idl ${CMAKE_CURRENT_SOURCE_DIR}/build/main_glue
)
set_property(SOURCE src-cpp/main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/build/main_glue.cpp)
#  ---  ---  ---

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}/build
)

add_executable(base91lib
    src-cpp/main.cpp
)

set_target_properties(base91lib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(base91lib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(base91lib
    PRIVATE unofficial::base91::base91
)

