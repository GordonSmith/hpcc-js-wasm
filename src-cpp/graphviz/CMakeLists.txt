project(graphvizlib)

set(expat_DIR "${VCPKG_SHARE_DIR}/expat")
find_package(expat CONFIG REQUIRED)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-sFILESYSTEM=1"
    "-sEXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    "-sEXPORTED_FUNCTIONS=\"['_free', '_malloc']\""
    "-sEXPORTED_RUNTIME_METHODS=\"[UTF8ToString]\""
    "--post-js ${CMAKE_CURRENT_BINARY_DIR}/main_glue.js"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

#  Generate Glue from IDL file  ---
add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/main.idl
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/main_glue.js ${CMAKE_CURRENT_BINARY_DIR}/main_glue.cpp
    COMMAND python3 ${REPO_DIR}/emsdk/upstream/emscripten/tools/webidl_binder.py ${CMAKE_CURRENT_SOURCE_DIR}/main.idl ${CMAKE_CURRENT_BINARY_DIR}/main_glue
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/main_glue.cpp)
#  ---  ---  ---

set(SRCS
    main.cpp
)

include_directories(
    ${VCPKG_INCLUDE_DIR}/graphviz
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(graphvizlib
    ${SRCS}
)

set_target_properties(graphvizlib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(graphvizlib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(graphvizlib PRIVATE
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

packWasm(graphvizlib)

# add_executable(graphvizlib-web
#     ${SRCS}
# )

# set_target_properties(graphvizlib-web PROPERTIES LINK_FLAGS "${LINK_FLAGS} -s ENVIRONMENT=web")

# target_link_libraries(graphvizlib-web PRIVATE
#     gvplugin_core
#     gvplugin_dot_layout
#     gvplugin_neato_layout
#     ortho
# )

# add_executable(graphvizlib-worker
#     ${SRCS}
# )

# set_target_properties(graphvizlib-worker PROPERTIES LINK_FLAGS "${LINK_FLAGS} -s ENVIRONMENT=worker")

# target_link_libraries(graphvizlib-worker PRIVATE
#     gvplugin_core
#     gvplugin_dot_layout
#     gvplugin_neato_layout
#     ortho
# )

# add_executable(graphvizlib-node
#     ${SRCS}
# )

# set_target_properties(graphvizlib-node PROPERTIES LINK_FLAGS "${LINK_FLAGS} -s ENVIRONMENT=node")

# target_link_libraries(graphvizlib-node PRIVATE
#     gvplugin_core
#     gvplugin_dot_layout
#     gvplugin_neato_layout
#     ortho
# )
