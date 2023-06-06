project( hthor )

set(ECLAGENT_DIR ${HPCC_SOURCE_DIR}/ecl/eclagent)

set ( SRCS
      ${ECLAGENT_DIR}/eclagentmain.cpp
    )

include_directories (
         .
         ${HPCC_SOURCE_DIR}/ecl/hthor
         ${HPCC_SOURCE_DIR}/system/jlib
         ${HPCC_SOURCE_DIR}/system/include
         ${HPCC_SOURCE_DIR}/rtl/include
         ${HPCC_SOURCE_DIR}/common/wuanalysis
         ${CMAKE_BINARY_DIR}
         ${CMAKE_BINARY_DIR}/oss
    )

SET (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${STRICT_CXX_FLAGS}")

ADD_DEFINITIONS( -DNO_SYBASE -D_CONSOLE )

add_executable( hthor ${SRCS} )
# install ( TARGETS hthor RUNTIME DESTINATION ${EXEC_DIR} )
# target_link_libraries ( hthor
#       hthorlib
#       wuanalysis
#       ${CPPUNIT_LIBRARIES}
#     )

# Install ( PROGRAMS ${CMAKE_CURRENT_SOURCE_DIR}/start_eclagent DESTINATION ${EXEC_DIR} COMPONENT Runtime )
