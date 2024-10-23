project(duckdblib)


# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
set(EM_CPP_FLAGS
    ${EM_CPP_FLAGS}
)

string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-sFILESYSTEM=1"
    "-sEXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    "-sEXPORTED_FUNCTIONS=\"['_free', '_malloc']\""
    "-sEXPORTED_RUNTIME_METHODS=\"[UTF8ToString]\""
    "--post-js ${CMAKE_CURRENT_BINARY_DIR}/main_glue.js"
    "--emit-tsd ${CMAKE_CURRENT_BINARY_DIR}/duckdblib.d.ts"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

#  Generate Glue from IDL file  ---
add_custom_command(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/main.idl
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/main_glue.js ${CMAKE_CURRENT_BINARY_DIR}/main_glue.cpp
    COMMAND python3 ${CMAKE_BINARY_DIR}/../emsdk/upstream/emscripten/tools/webidl_binder.py ${CMAKE_CURRENT_SOURCE_DIR}/main.idl ${CMAKE_CURRENT_BINARY_DIR}/main_glue
)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/main_glue.cpp)
#  ---  ---  ---

set(SRCS
    main.cpp
    )

include_directories(
    ${DUCKDB_DIR}/submodules/duckdb/src/include
    # ${DUCKDB_DIR}/build/third_party/arrow/install/include
    # ${DUCKDB_DIR}/build/third_party/rapidjson/install/include
    ${CMAKE_CURRENT_BINARY_DIR}
)

add_executable(duckdblib
    ${SRCS}
)

set_target_properties(duckdblib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(duckdblib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

set(install_dir ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install)

target_link_libraries(duckdblib INTERFACE
    ${install_dir}/lib/libduckdb.a
    INTERFACE ${install_dir}/lib/libduckdb_re2.a
    INTERFACE ${install_dir}/lib/libduckdb_fmt.a
    INTERFACE ${install_dir}/lib/libduckdb_fsst.a
    INTERFACE ${install_dir}/lib/libduckdb_hyperloglog.a
    INTERFACE ${install_dir}/lib/libduckdb_miniz.a
    INTERFACE ${install_dir}/lib/libduckdb_mbedtls.a
    INTERFACE ${install_dir}/lib/libduckdb_yyjson.a
    INTERFACE ${install_dir}/lib/libduckdb_skiplistlib.a
    INTERFACE ${install_dir}/lib/libduckdb_pg_query.a
    INTERFACE ${install_dir}/lib/libduckdb_utf8proc.a
    INTERFACE ${install_dir}/lib/libduckdb_fastpforlib.a
    INTERFACE dl
    # ${DUCKDB_DIR}/build/relsize/eh/libduckdb_web.a
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libparquet_extension.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_fastpforlib.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_fmt.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_fsst.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_hyperloglog.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_mbedtls.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_miniz.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_pg_query.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_re2.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_skiplistlib.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_static.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_utf8proc.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_yyjson.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libfts_extension.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libjson_extension.a
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/arrow/install/lib/libarrow.a






    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_static.a
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_utf8proc.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_yyjson.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libfts_extension.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libjson_extension.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libparquet_extension.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_fastpforlib.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_fmt.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_fsst.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_hyperloglog.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_mbedtls.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_miniz.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_pg_query.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_re2.a 
    # ${DUCKDB_DIR}/build/relsize/eh/third_party/duckdb/install/lib/libduckdb_skiplistlib.a
    # ${DUCKDB_DIR}/build/libduckdb_web.a
    # ${DUCKDB_DIR}/build/libduckdb_web_fts.a
    # ${DUCKDB_DIR}/build/libduckdb_web_json.a
    # ${DUCKDB_DIR}/build/libduckdb_web_parquet.a
)
