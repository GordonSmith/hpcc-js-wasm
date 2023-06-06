project( eclrtl )

set(ECLRTL_DIR ${HPCC_SOURCE_DIR}/rtl/eclrtl)

set (    SRCS 
         ${ECLRTL_DIR}/eclhelper_base.cpp
         ${ECLRTL_DIR}/eclhelper_dyn.cpp
         ${ECLRTL_DIR}/eclrtl.cpp 
         ${ECLRTL_DIR}/eclregex.cpp
         ${ECLRTL_DIR}/rtlbcd.cpp 
         ${ECLRTL_DIR}/rtldistr.cpp 
         ${ECLRTL_DIR}/rtlds.cpp 
         ${ECLRTL_DIR}/rtldynfield.cpp 
         ${ECLRTL_DIR}/rtlint.cpp 
         ${ECLRTL_DIR}/rtlkey.cpp 
         ${ECLRTL_DIR}/rtlnewkey.cpp
         ${ECLRTL_DIR}/rtlnktest.cpp
         ${ECLRTL_DIR}/rtlqstr.cpp 
         ${ECLRTL_DIR}/rtlrank.cpp 
         ${ECLRTL_DIR}/rtlfield.cpp 
         ${ECLRTL_DIR}/rtlread.cpp 
         ${ECLRTL_DIR}/rtlrecord.cpp
         ${ECLRTL_DIR}/rtltype.cpp 
         ${ECLRTL_DIR}/rtlxml.cpp
         ${ECLRTL_DIR}/rtlcommon.cpp
         ${ECLRTL_DIR}/rtlformat.cpp
         ${ECLRTL_DIR}/
         ${ECLRTL_DIR}/eclinclude4.hpp
         ${ECLRTL_DIR}/eclrtl.hpp
         ${ECLRTL_DIR}/eclrtl_imp.hpp
         ${ECLRTL_DIR}/rtlbcd.hpp
         ${ECLRTL_DIR}/rtldistr.hpp
         ${ECLRTL_DIR}/rtlds_imp.hpp
         ${ECLRTL_DIR}/rtlembed.hpp
         ${ECLRTL_DIR}/rtlfield.hpp
         ${ECLRTL_DIR}/rtlkey2.hpp
         ${ECLRTL_DIR}/rtlkey.hpp
         ${ECLRTL_DIR}/rtlnewkey.hpp
         ${ECLRTL_DIR}/rtlread_imp.hpp
         ${ECLRTL_DIR}/rtlrecord.hpp
         ${ECLRTL_DIR}/rtlsize.hpp
         ${ECLRTL_DIR}/rtltype.hpp
         ${ECLRTL_DIR}/rtlbcdtest.cpp 
    )

include_directories ( 
         ${ECLRTL_DIR}/./../../rtl/include 
         ${ECLRTL_DIR}/./../../rtl/nbcd 
         ${ECLRTL_DIR}/./../../rtl/eclrtl 
         ${ECLRTL_DIR}/./../../system/include 
         ${ECLRTL_DIR}/./../../system/jlib 
         ${ECLRTL_DIR}/./../../roxie/roxiemem
         ${ECLRTL_DIR}/./../../testing/unittests
         ${ECLRTL_DIR}/${Boost_INCLUDE_DIRS}
    )

ADD_DEFINITIONS( -D_USRDLL -DECLRTL_EXPORTS )

if ((USE_BOOST_REGEX) AND (NOT WIN32))
  ADD_DEFINITIONS( -DBOOST_DYN_LINK )
endif ()

if ((CMAKE_COMPILER_IS_GNUCXX AND NOT CMAKE_CXX_COMPILER_VERSION VERSION_GREATER 8.0.0))
  set_source_files_properties(eclrtl.cpp PROPERTIES COMPILE_FLAGS -fno-tree-vectorize)
endif ()

add_library(eclrtl
  ${SRCS}
)

if(CENTOS_6_BOOST)
  add_dependencies(eclrtl boost-regex)
  target_link_libraries( eclrtl boost-regex)
else()
  target_link_libraries( eclrtl ${Boost_REGEX_LIBRARY} )
endif()

target_link_libraries ( eclrtl 
      jlib
      nbcd
      roxiemem
    )

if (USE_ICU)
    include_directories (
         ${ECLRTL_DIR}/${ICU_INCLUDE_DIR}
        )
    target_link_libraries ( eclrtl
         ${ECLRTL_DIR}/ ${ICU_LIBRARIES}
        )
endif ()

# if (CMAKE_COMPILER_IS_GNUCC OR CMAKE_COMPILER_IS_CLANG)
#   SET (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wno-switch -Wno-unused-parameter -Werror -Wno-delete-non-virtual-dtor -Wno-overloaded-virtual -Wno-deprecated-declarations")
# endif()



# if (NOT PLUGIN)
#   install ( TARGETS eclrtl RUNTIME DESTINATION ${EXEC_DIR} LIBRARY DESTINATION ${LIB_DIR} ARCHIVE DESTINATION componentfiles/cl/lib CALC_DEPS)
#   FOREACH( iFILES
#     ${CMAKE_CURRENT_SOURCE_DIR}/eclinclude4.hpp
#     ${CMAKE_CURRENT_SOURCE_DIR}/eclrtl.hpp
#     ${CMAKE_CURRENT_SOURCE_DIR}/eclrtl_imp.hpp
#     ${CMAKE_CURRENT_SOURCE_DIR}/rtlbcd.hpp
#     ${CMAKE_CURRENT_SOURCE_DIR}/rtldistr.hpp
#     ${CMAKE_CURRENT_SOURCE_DIR}/rtlds_imp.hpp
#     ${CMAKE_CURRENT_SOURCE_DIR}/rtlfield.hpp
#     ${CMAKE_CURRENT_SOURCE_DIR}/rtlkey.hpp
#     ${CMAKE_CURRENT_SOURCE_DIR}/rtlrecord.hpp
#   )
#     install ( FILES ${iFILES} DESTINATION componentfiles/cl/include COMPONENT Runtime )
#   ENDFOREACH ( iFILES )
# endif()
