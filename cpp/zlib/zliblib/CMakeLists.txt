PROJECT(zliblib)

SET(SRCS
    zlib-helper.cpp
)

INCLUDE_DIRECTORIES(
    ${CMAKE_CURRENT_BINARY_DIR}
)

ADD_LIBRARY(zliblib ${SRCS})

TARGET_LINK_LIBRARIES(zliblib 
    ZLIB::ZLIB
    unofficial::base91::base91
)
