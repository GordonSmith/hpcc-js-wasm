project( jlib )

INCLUDE(CheckLibraryExists)

if (NOT WIN32 AND NOT WIN64)
CHECK_LIBRARY_EXISTS(dl dlopen "" HAVE_LIBDL)
CHECK_LIBRARY_EXISTS(crypt crypt "" HAVE_LIBCRYPT)
endif ()

if(NOT TARGET lzma)
  add_subdirectory(${HPCC_WASM_DIR}/system/lzma ${CMAKE_BINARY_DIR}/system/lzma)
endif(NOT TARGET lzma)

find_package(lz4 CONFIG REQUIRED)

if(NOT TARGET libbase58)
  add_subdirectory(${HPCC_WASM_DIR}/system/libbase58 ${CMAKE_BINARY_DIR}/system/libbase58)
endif(NOT TARGET libbase58)

find_package(yaml CONFIG REQUIRED)

SET (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${STRICT_CXX_FLAGS}")

set(JLIB_DIR ${HPCC_SOURCE_DIR}/system/jlib)

set (    SRCS
    ${SCM_GENERATED_INCLUDES}
         ${JLIB_DIR}/jargv.cpp
         ${JLIB_DIR}/jarray.cpp
         ${JLIB_DIR}/javahash.cpp
         ${JLIB_DIR}/jbsocket.cpp
         ${JLIB_DIR}/jbuff.cpp
         ${JLIB_DIR}/jcomp.cpp
         ${JLIB_DIR}/jcrc.cpp
         ${JLIB_DIR}/jdebug.cpp
         ${JLIB_DIR}/jencrypt.cpp
         ${JLIB_DIR}/jexcept.cpp
         ${JLIB_DIR}/jfile.cpp
         ${JLIB_DIR}/jflz.cpp
         ${JLIB_DIR}/jhash.cpp
         ${JLIB_DIR}/jiface.cpp
         ${JLIB_DIR}/jio.cpp
         ${JLIB_DIR}/jiter.cpp
         ${JLIB_DIR}/jkeyboard.cpp
         ${JLIB_DIR}/jlib.cpp
         ${JLIB_DIR}/jlog.cpp
         ${JLIB_DIR}/jlz4.cpp
         ${JLIB_DIR}/jlzma.cpp
         ${JLIB_DIR}/jlzw.cpp
         ${JLIB_DIR}/jmd5.cpp
         ${JLIB_DIR}/jmemleak.cpp
         ${JLIB_DIR}/jmetrics.cpp
         ${JLIB_DIR}/jmisc.cpp
         ${JLIB_DIR}/jmutex.cpp
         ${JLIB_DIR}/jobserve.cpp
         ${JLIB_DIR}/jprop.cpp
         ${JLIB_DIR}/jptree.cpp
         ${JLIB_DIR}/jqueue.cpp
         ${JLIB_DIR}/jregexp.cpp
         ${JLIB_DIR}/jrowstream.cpp
         ${JLIB_DIR}/jsecrets.cpp
         ${JLIB_DIR}/jsem.cpp
         ${JLIB_DIR}/jset.cpp
         ${JLIB_DIR}/jsmartsock.cpp
         ${JLIB_DIR}/jsocket.cpp
         ${JLIB_DIR}/jsort.cpp
         ${JLIB_DIR}/jsort2.cpp
         ${JLIB_DIR}/jstats.cpp
         ${JLIB_DIR}/jstream.cpp
         ${JLIB_DIR}/jstring.cpp
         ${JLIB_DIR}/jsuperhash.cpp
         ${JLIB_DIR}/jtask.cpp
         ${JLIB_DIR}/jthread.cpp
         ${JLIB_DIR}/jtime.cpp
         ${JLIB_DIR}/junicode.cpp
         ${JLIB_DIR}/jutil.cpp
         ${JLIB_DIR}/jtrace.cpp
         ${HPCC_SOURCE_DIR}/system/globalid/lnuid.cpp
         ${HPCC_SOURCE_DIR}/system/codesigner/codesigner.cpp
         ${HPCC_SOURCE_DIR}/system/codesigner/gpgcodesigner.cpp
         ${JLIB_DIR}/sourcedoc.xml
    )

set (    INCLUDES
        ${HPCC_SOURCE_DIR}/system/codesigner/codesigner.hpp
        ${JLIB_DIR}/jaio.hpp
        ${JLIB_DIR}/jarray.hpp
        ${JLIB_DIR}/jatomic.hpp
        ${JLIB_DIR}/javahash.hpp
        ${JLIB_DIR}/javahash.tpp
        ${JLIB_DIR}/jbuff.hpp
        ${JLIB_DIR}/jcomp.hpp
        ${JLIB_DIR}/jcomp.ipp
        ${JLIB_DIR}/jcrc.hpp
        ${JLIB_DIR}/jdebug.hpp
        ${JLIB_DIR}/jelogtype.hpp
        ${JLIB_DIR}/jencrypt.hpp
        ${JLIB_DIR}/jerror.hpp
        ${JLIB_DIR}/jexcept.hpp
        ${JLIB_DIR}/jfcmp.hpp
        ${JLIB_DIR}/jfile.hpp
        ${JLIB_DIR}/jfile.ipp
        ${JLIB_DIR}/jflz.hpp
        ${JLIB_DIR}/jhash.hpp
        ${JLIB_DIR}/jhash.ipp
        ${JLIB_DIR}/jheap.hpp
        ${JLIB_DIR}/jheap.ipp
        ${JLIB_DIR}/jiface.hpp
        ${JLIB_DIR}/jio.hpp
        ${JLIB_DIR}/jio.ipp
        ${JLIB_DIR}/jisem.hpp
        ${JLIB_DIR}/jiter.hpp
        ${JLIB_DIR}/jiter.ipp
        ${JLIB_DIR}/jiter.tpp
        ${JLIB_DIR}/jkeyboard.hpp
        ${JLIB_DIR}/jlib.hpp
        ${JLIB_DIR}/jliball.hpp
        ${JLIB_DIR}/jlog.hpp
        ${JLIB_DIR}/jlog.ipp
        ${JLIB_DIR}/jlz4.hpp
        ${JLIB_DIR}/jlzma.hpp
        ${JLIB_DIR}/jlzw.hpp
        ${JLIB_DIR}/jlzw.ipp
        ${JLIB_DIR}/jmd5.hpp
        ${JLIB_DIR}/jmisc.hpp
        ${JLIB_DIR}/jmutex.hpp
        ${JLIB_DIR}/jobserve.hpp
        ${JLIB_DIR}/jobserve.ipp
        ${JLIB_DIR}/jpqueue.hpp
        ${JLIB_DIR}/jprop.hpp
        ${JLIB_DIR}/jptree.hpp
        ${JLIB_DIR}/jptree.ipp
        ${JLIB_DIR}/jqueue.hpp
        ${JLIB_DIR}/jqueue.tpp
        ${JLIB_DIR}/jregexp.hpp
        ${JLIB_DIR}/jrespool.tpp
        ${JLIB_DIR}/jrowstream.hpp
        ${JLIB_DIR}/jscm.hpp
        ${JLIB_DIR}/jsecrets.hpp
        ${JLIB_DIR}/jsem.hpp
        ${JLIB_DIR}/jset.hpp
        ${JLIB_DIR}/jsmartsock.hpp
        ${JLIB_DIR}/jsmartsock.ipp
        ${JLIB_DIR}/jsocket.hpp
        ${JLIB_DIR}/jsort.hpp
        ${JLIB_DIR}/jsorta.hpp
        ${JLIB_DIR}/jstatcodes.h
        ${JLIB_DIR}/jstats.h
        ${JLIB_DIR}/jstream.hpp
        ${JLIB_DIR}/jstream.ipp
        ${JLIB_DIR}/jstring.hpp
        ${JLIB_DIR}/jsuperhash.hpp
        ${JLIB_DIR}/jtask.hpp
        ${JLIB_DIR}/jthread.hpp
        ${JLIB_DIR}/jtime.hpp
        ${JLIB_DIR}/jtime.ipp
        ${JLIB_DIR}/junicode.hpp
        ${JLIB_DIR}/jutil.hpp
        ${JLIB_DIR}/jtrace.hpp
        ${HPCC_SOURCE_DIR}/system/httplib/httplib.h
        ${HPCC_SOURCE_DIR}/system/security/shared/opensslcommon.hpp
        ${HPCC_SOURCE_DIR}/system/security/cryptohelper/cryptocommon.cpp
        ${HPCC_SOURCE_DIR}/system/security/cryptohelper/digisign.cpp
        ${HPCC_SOURCE_DIR}/system/security/cryptohelper/pke.cpp
        ${HPCC_SOURCE_DIR}/system/security/cryptohelper/ske.cpp
        )

set_source_files_properties(jmd5.cpp jsort.cpp PROPERTIES SKIP_UNITY_BUILD_INCLUSION ON)

if (CMAKE_COMPILER_IS_GNUCC OR CMAKE_COMPILER_IS_CLANG)
    set_property (SOURCE jencrypt.cpp APPEND_STRING PROPERTY COMPILE_FLAGS " -fno-strict-aliasing")
endif ()
if (CMAKE_COMPILER_IS_GNUCC)
    set_property (SOURCE jlzw.cpp APPEND_STRING PROPERTY COMPILE_FLAGS " -Wno-array-bounds")   # Compiler erroneously reports array bounds errors in some cases
    if (CMAKE_CXX_COMPILER_VERSION VERSION_LESS 5.0.0)
        set_property (SOURCE jencrypt.cpp APPEND_STRING PROPERTY COMPILE_FLAGS " -Wno-array-bounds")   # Compiler erroneously reports array bounds errors in some cases
    endif ()
endif ()

include_directories (
         ${HPCC_SOURCE_DIR}/system/jlib
         ${HPCC_SOURCE_DIR}/system/win32
         ${HPCC_SOURCE_DIR}/system/include
         ${HPCC_SOURCE_DIR}/system/lzma
         ${HPCC_SOURCE_DIR}/system/globalid
         ${HPCC_SOURCE_DIR}/system/security/shared
         ${HPCC_SOURCE_DIR}/system/security/cryptohelper
         ${HPCC_SOURCE_DIR}/system/httplib
         ${CMAKE_CURRENT_BINARY_DIR}  # for generated jelog.h file
         ${CMAKE_BINARY_DIR}
         ${CMAKE_BINARY_DIR}/oss
    )

ADD_DEFINITIONS( -D_USRDLL -DJLIB_EXPORTS )
add_library( jlib STATIC ${SRCS} ${INCLUDES} )

# target_link_libraries ( jlib
#         ${JLIB_DIR}/lzma
#         ${JLIB_DIR}/lz4::lz4
#         ${JLIB_DIR}/libbase58
#         ${JLIB_DIR}/yaml
#        )

# if ( ${HAVE_LIBDL} )
# target_link_libraries ( jlib dl)
# endif ( ${HAVE_LIBDL} )

# if ( ${HAVE_LIBCRYPT} )
# target_link_libraries ( jlib crypt)
# endif ( ${HAVE_LIBCRYPT} )

# IF (USE_OPENSSL)
# target_link_libraries ( jlib ${OPENSSL_LIBRARIES})
# endif (USE_OPENSSL)

# IF (WIN32 AND USE_ZLIB)
# target_link_libraries ( jlib ZLIB::ZLIB )
# endif (WIN32 AND USE_ZLIB)

# if (WIN32)
#  target_link_libraries ( jlib ws2_32 mpr.lib Winmm.lib psapi.lib )
# elseif (("${CMAKE_SYSTEM_NAME}" STREQUAL "Darwin" ))
# else ()
#  target_link_libraries ( jlib rt )
# endif ()

# if (NOT PLUGIN)
#     if (WIN32)
#         ${JLIB_DIR}/FILE(TO_NATIVE_PATH "${CMAKE_CURRENT_BINARY_DIR}" WINDOWS_CMAKE_CURRENT_BINARY_DIR)
#         ${JLIB_DIR}/FILE(TO_NATIVE_PATH "${CMAKE_CURRENT_SOURCE_DIR}\\jelog.mc" WINDOWS_CMAKE_CURRENT_SOURCE_DIR)
#         ${JLIB_DIR}/add_custom_command ( DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/jelog.mc
#         ${JLIB_DIR}/         ${JLIB_DIR}/        OUTPUT ${EXECUTABLE_OUTPUT_PATH}/$<CONFIG>/jelog.dll ${CMAKE_CURRENT_BINARY_DIR}/jelog.h
#         ${JLIB_DIR}/         ${JLIB_DIR}/        COMMAND echo mc -r ${WINDOWS_CMAKE_CURRENT_BINARY_DIR} -h ${WINDOWS_CMAKE_CURRENT_BINARY_DIR} ${WINDOWS_CMAKE_CURRENT_SOURCE_DIR}
#         ${JLIB_DIR}/         ${JLIB_DIR}/        COMMAND echo rc -r -fo ${CMAKE_CURRENT_BINARY_DIR}/jelog.res ${CMAKE_CURRENT_BINARY_DIR}/jelog.rc
#         ${JLIB_DIR}/         ${JLIB_DIR}/        COMMAND echo link -dll -noentry -machine:IX86 -out:${EXECUTABLE_OUTPUT_PATH}/$<CONFIG>/jelog.dll ${CMAKE_CURRENT_BINARY_DIR}/jelog.res
#         ${JLIB_DIR}/         ${JLIB_DIR}/        COMMAND mc -r ${WINDOWS_CMAKE_CURRENT_BINARY_DIR} -h ${WINDOWS_CMAKE_CURRENT_BINARY_DIR} ${WINDOWS_CMAKE_CURRENT_SOURCE_DIR}
#         ${JLIB_DIR}/         ${JLIB_DIR}/        COMMAND rc -r -fo ${CMAKE_CURRENT_BINARY_DIR}/jelog.res ${CMAKE_CURRENT_BINARY_DIR}/jelog.rc
#         ${JLIB_DIR}/         ${JLIB_DIR}/        COMMAND link -dll -noentry -machine:IX86 -out:${EXECUTABLE_OUTPUT_PATH}/$<CONFIG>/jelog.dll ${CMAKE_CURRENT_BINARY_DIR}/jelog.res
#         ${JLIB_DIR}/         ${JLIB_DIR}/       )
#         ${JLIB_DIR}/add_custom_target ( jelog ALL DEPENDS ${EXECUTABLE_OUTPUT_PATH}/$<CONFIG>/jelog.dll )
#         ${JLIB_DIR}/add_dependencies( jlib jelog )
#         ${JLIB_DIR}/install ( PROGRAMS ${EXECUTABLE_OUTPUT_PATH}/$<CONFIG>/jelog.dll DESTINATION ${EXEC_DIR} )
#     endif ()
#     install ( TARGETS jlib RUNTIME DESTINATION ${EXEC_DIR} LIBRARY DESTINATION ${LIB_DIR} CALC_DEPS )
#     install ( FILES ${CMAKE_CURRENT_SOURCE_DIR}/jscm.hpp DESTINATION componentfiles/cl/include COMPONENT Runtime )
# endif()
