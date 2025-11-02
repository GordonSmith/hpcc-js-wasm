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
    "-fno-exceptions"
    "-fno-rtti"
)
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

# For WASI component builds, we need minimal Emscripten flags
# Remove JavaScript-specific flags that are incompatible with wasm-tools component
set(EM_LINK_FLAGS 
    "--no-entry"
    "-Wl,--export-all"
    "-fno-exceptions"
    "-s" "DISABLE_EXCEPTION_CATCHING=1"
    "-s" "DISABLE_EXCEPTION_THROWING=1"
    "-s" "STANDALONE_WASM"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

#  Generate C bindings from WIT file  --- 
add_custom_command(
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
    COMMAND wit-bindgen c ${CMAKE_CURRENT_SOURCE_DIR}/wit/graphviz.wit --out-dir ${CMAKE_CURRENT_BINARY_DIR}
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/wit/graphviz.wit
    COMMENT "Generating C bindings from WIT file"
    VERBATIM
)

add_custom_target(generate_${PROJECT_NAME}_bindings
    DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/root.c ${CMAKE_CURRENT_BINARY_DIR}/root.h ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
)
#  ---  ---  ---

include_directories(
    ${Graphviz_INCLUDE_DIRS}/graphviz
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(${PROJECT_NAME}
    src-cpp/main.cpp
    src-cpp/util.cpp
    src-cpp/exception_stubs.cpp
    ${CMAKE_CURRENT_BINARY_DIR}/root.c
    ${CMAKE_CURRENT_BINARY_DIR}/root.h
)

add_dependencies(${PROJECT_NAME} generate_${PROJECT_NAME}_bindings)

set_target_properties(${PROJECT_NAME} PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(${PROJECT_NAME} PROPERTIES LINK_FLAGS "${LINK_FLAGS}")
set_target_properties(${PROJECT_NAME} PROPERTIES OUTPUT_NAME "${PROJECT_NAME}" SUFFIX ".wasm")

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
    ${CMAKE_CURRENT_BINARY_DIR}/root_component_type.o
)


#  Generate WASM Component from core module  ---
add_custom_command(
    TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E echo "Creating WASM component from core module..."
    COMMAND wasm-tools component new $<TARGET_FILE:${PROJECT_NAME}> --adapt ${CMAKE_SOURCE_DIR}/node_modules/@bytecodealliance/jco/lib/wasi_snapshot_preview1.reactor.wasm -o ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.component.wasm
    COMMAND ${CMAKE_COMMAND} -E echo "Transpiling component to JavaScript..."
    COMMAND npx jco transpile -b 10000000 --no-nodejs-compat ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}.component.wasm -o ${CMAKE_CURRENT_BINARY_DIR}
    COMMENT "Creating and transpiling WASM component"
    VERBATIM
)
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
