project(utils)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-sEXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    "-sEXPORTED_FUNCTIONS=\"[]\""
    "-sEXPORTED_RUNTIME_METHODS=\"[]\""
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

#  Generate Glue from WIT file  ---
# add_custom_command(
#     MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/utils.wit
#     OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/utils_xxx.c ${CMAKE_CURRENT_BINARY_DIR}/utils_xxx.h ${CMAKE_CURRENT_BINARY_DIR}/utils_xxx_wit_component_type.o
#     COMMAND wit-bindgen guest c ${CMAKE_CURRENT_SOURCE_DIR}/utils.wit
# )
# set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/utils.c)

add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/utils.wit
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/utils.c ${CMAKE_CURRENT_BINARY_DIR}/utils.h ${CMAKE_CURRENT_BINARY_DIR}/utils_wit_component_type.o
    COMMAND wit-bindgen host js ${CMAKE_CURRENT_SOURCE_DIR}/utils.wit
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
    utils_xxx.c
)

# set_target_properties(utils PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
# set_target_properties(utils PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(utils
    # ${CMAKE_CURRENT_BINARY_DIR}/utils_component_type.o
)

packWasm(utils)
