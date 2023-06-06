project(test)

set(USE_BOOST_REGEX 1)

set (HPCC_WASM_DIR ${CMAKE_CURRENT_SOURCE_DIR})

add_subdirectory(ecl)
add_subdirectory(rtl)
add_subdirectory(system)

include_directories(
    ${HPCC_SOURCE_DIR}/system/include
    ${HPCC_SOURCE_DIR}/system/jlib
    ${HPCC_SOURCE_DIR}/rtl/include
    ${HPCC_SOURCE_DIR}/rtl/eclrtl
)

add_executable(test 
    a.out.hpp
    a.out.cpp
)

target_link_libraries(test PRIVATE
    hthorlib
)