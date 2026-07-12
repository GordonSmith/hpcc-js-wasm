project(graphvizlib)

# find and link libraries
find_path(Graphviz_INCLUDE_DIRS NAMES graphviz/gvc.h HINTS "${VCPKG_INSTALLED_DIR}" REQUIRED)

# display directories where Graphviz libraries and headers are found
message("Graphviz libraries: ${graphviz_LIBRARIES}")
message("Graphviz include directories: ${Graphviz_INCLUDE_DIRS}")

find_package(expat CONFIG REQUIRED)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
set(EM_CPP_FLAGS 
    ${EM_CPP_FLAGS}
    "-fwasm-exceptions"
)
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-sEXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    "-sFILESYSTEM=1"

    "-fwasm-exceptions"
    "-sEXCEPTION_STACK_TRACES=1"
    "--emit-tsd ${CMAKE_CURRENT_BINARY_DIR}/graphvizlib.d.ts"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

set(SRCS
    src-cpp/main.cpp
    src-cpp/util.hpp
    src-cpp/util.cpp 
    # src-cpp/stubs.c
)

include_directories(
    ${Graphviz_INCLUDE_DIRS}/graphviz
)

add_executable(graphvizlib
    ${SRCS}
)

set_target_properties(graphvizlib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(graphvizlib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

# link libraries
function(add_graphviz_library library)
    find_library(GRAPHVIZ_${library} NAMES ${library})
    if(GRAPHVIZ_${library})
        target_link_libraries(graphvizlib PRIVATE ${GRAPHVIZ_${library}})
    else()
        message(FATAL_ERROR "Could not find library ${library}!")
    endif()
endfunction()

# common gvplugin_core gvplugin_dot_layout gvplugin_neato_layout ortho gvc cdt cgraph dotgen neatogen fdpgen sfdpgen twopigen circogen label osage patchwork pack sparse pathplan xdot
add_graphviz_library(common)
add_graphviz_library(gvc)
add_graphviz_library(gvplugin_core)
add_graphviz_library(gvplugin_dot_layout)
add_graphviz_library(gvplugin_neato_layout)
add_graphviz_library(ortho)
add_graphviz_library(cdt)
add_graphviz_library(cgraph)
add_graphviz_library(dotgen)
add_graphviz_library(neatogen)
add_graphviz_library(fdpgen)
add_graphviz_library(sfdpgen)
add_graphviz_library(twopigen)
add_graphviz_library(circogen)
add_graphviz_library(label)
add_graphviz_library(osage)
add_graphviz_library(patchwork)
add_graphviz_library(pack)
add_graphviz_library(sparse)
add_graphviz_library(pathplan)
add_graphviz_library(xdot)
add_graphviz_library(util)
add_graphviz_library(vpsc)

target_link_libraries(graphvizlib PRIVATE
    ${EXPAT_LIBRARIES}
)

# Copy generated files to source directories
add_custom_command(TARGET graphvizlib POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
        ${CMAKE_CURRENT_BINARY_DIR}/graphvizlib.d.ts
        ${CMAKE_CURRENT_SOURCE_DIR}/types/graphvizlib.d.ts
    COMMENT "Copying generated graphvizlib files to source directories"
)

# add_executable(graphvizlib-web
#     ${SRCS}
# )

# set_target_properties(graphvizlib-web PROPERTIES LINK_FLAGS "${LINK_FLAGS} -s ENVIRONMENT=web")

# ---------------------------------------------------------------------------
# Java / JVM target — standalone WASI WebAssembly, no JavaScript runtime needed
# ---------------------------------------------------------------------------
# Uses the same EM_CPP_FLAGS as the JS target (includes -fwasm-exceptions).
# Link flags differ: standalone-wasm replaces the Emscripten JS glue with
# WASIp1 syscalls, making the module loadable by Endive on any JVM.
string(REPLACE ";" " " JAVA_CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_JAVA_LINK_FLAGS
    "--standalone-wasm"
    "--no-entry"
    "-sEXPORTED_FUNCTIONS=['_graphviz_malloc','_graphviz_free','_graphviz_version','_graphviz_layout','_graphviz_get_result_ptr','_graphviz_last_error','_cgraph_create','_cgraph_destroy','_cgraph_to_dot','_cgraph_layout','_cgraph_add_node','_cgraph_add_edge','_cgraph_set_graph_attr','_cgraph_set_node_attr','_cgraph_set_edge_attr','_cgraph_remove_node','_cgraph_remove_edge','_cgraph_remove_subgraph','_cgraph_has_node','_cgraph_has_edge','_cgraph_has_subgraph','_cgraph_node_count','_cgraph_edge_count','_cgraph_subgraph_count','_cgraph_get_graph_attr','_cgraph_get_node_attr','_cgraph_get_edge_attr','_cgraph_node_names','_cgraph_subgraph_names','_cgraph_edges','_cgraph_out_edges','_cgraph_in_edges','_cgraph_node_edges','_cgraph_add_subgraph','_cgraph_get_subgraph','_csubgraph_add_node','_csubgraph_add_edge','_csubgraph_set_attr','_csubgraph_set_node_attr','_csubgraph_set_edge_attr','_csubgraph_remove_node','_csubgraph_remove_edge','_csubgraph_has_node','_csubgraph_has_edge','_csubgraph_node_count','_csubgraph_edge_count','_csubgraph_get_attr','_csubgraph_get_node_attr','_csubgraph_get_edge_attr','_csubgraph_node_names','_csubgraph_edges','_csubgraph_out_edges','_csubgraph_in_edges','_csubgraph_node_edges']"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sASSERTIONS=0"
)
string(REPLACE ";" " " JAVA_LINK_FLAGS "${EM_JAVA_LINK_FLAGS}")

add_executable(graphvizlib_java
    src-cpp/java_bridge.cpp
)

set_target_properties(graphvizlib_java PROPERTIES
    COMPILE_FLAGS "${JAVA_CPP_FLAGS}"
    LINK_FLAGS    "${JAVA_LINK_FLAGS}"
    SUFFIX        ".wasm"
)

target_include_directories(graphvizlib_java PRIVATE
    ${Graphviz_INCLUDE_DIRS}/graphviz
)

# Re-use the library paths already resolved for the JS target.
target_link_libraries(graphvizlib_java PRIVATE
    ${GRAPHVIZ_common}
    ${GRAPHVIZ_gvc}
    ${GRAPHVIZ_gvplugin_core}
    ${GRAPHVIZ_gvplugin_dot_layout}
    ${GRAPHVIZ_gvplugin_neato_layout}
    ${GRAPHVIZ_ortho}
    ${GRAPHVIZ_cdt}
    ${GRAPHVIZ_cgraph}
    ${GRAPHVIZ_dotgen}
    ${GRAPHVIZ_neatogen}
    ${GRAPHVIZ_fdpgen}
    ${GRAPHVIZ_sfdpgen}
    ${GRAPHVIZ_twopigen}
    ${GRAPHVIZ_circogen}
    ${GRAPHVIZ_label}
    ${GRAPHVIZ_osage}
    ${GRAPHVIZ_patchwork}
    ${GRAPHVIZ_pack}
    ${GRAPHVIZ_sparse}
    ${GRAPHVIZ_pathplan}
    ${GRAPHVIZ_xdot}
    ${GRAPHVIZ_util}
    ${GRAPHVIZ_vpsc}
    ${EXPAT_LIBRARIES}
)

# Copy the WASI WASM to the Java package resources so it is bundled in the JAR.
add_custom_command(TARGET graphvizlib_java POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E make_directory
        ${CMAKE_CURRENT_SOURCE_DIR}/../../packages-java/graphviz/src/main/resources
    COMMAND ${CMAKE_COMMAND} -E copy
        ${CMAKE_CURRENT_BINARY_DIR}/graphvizlib_java.wasm
        ${CMAKE_CURRENT_SOURCE_DIR}/../../packages-java/graphviz/src/main/resources/graphvizlib.wasm
    COMMENT "Copying WASI WASM to Java package resources"
)

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
