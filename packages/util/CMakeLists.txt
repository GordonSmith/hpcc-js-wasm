PROJECT(UtilModule)

SET(SRCS
    util.hpp
    util.cpp
)

INCLUDE_DIRECTORIES(
    ${VCPKG_INCLUDE_DIR}
)

ADD_LIBRARY(UtilModule
    ${SRCS}
)

target_include_directories(UtilModule PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
