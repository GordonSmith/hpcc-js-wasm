project(graphlib)

find_package(Boost REQUIRED COMPONENTS graph)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js

set(EM_CPP_FLAGS 
    ${EM_CPP_FLAGS}
)
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-sEXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    "-lembind"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(graphlib
    main.cpp
)

set_target_properties(graphlib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(graphlib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(graphlib
    PRIVATE Boost::graph
)
