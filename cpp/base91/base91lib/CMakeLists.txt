PROJECT(base91lib)

SET(SRCS
    base91lib.cpp
)

INCLUDE_DIRECTORIES(
    ${VCPKG_INCLUDE_DIR}
)

ADD_LIBRARY(base91lib ${SRCS})

TARGET_LINK_LIBRARIES(base91lib 
    unofficial::base91::base91
)
