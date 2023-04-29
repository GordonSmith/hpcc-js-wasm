project(testlib)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-sSTANDALONE_WASM=1"
    # "-sEXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    # "-sEXPORTED_FUNCTIONS=\"[]\""
    # "-sEXPORTED_RUNTIME_METHODS=\"[]\""
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(testlib
    main.cpp
)

set_target_properties(testlib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(testlib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(testlib
)

# packWasm(testlib)
