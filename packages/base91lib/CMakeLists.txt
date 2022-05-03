PROJECT(base91lib)

find_package(unofficial-base91 CONFIG REQUIRED)

SET(SRCS
    base91lib.hpp
    base91lib.cpp
)

INCLUDE_DIRECTORIES(
    ${VCPKG_INCLUDE_DIR}
)

ADD_LIBRARY(base91lib
    ${SRCS}
)

TARGET_LINK_LIBRARIES(base91lib PRIVATE 
    unofficial::base91::base91
)

target_include_directories(base91lib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
