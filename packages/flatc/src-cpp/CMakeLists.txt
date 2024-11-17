project(flatclib)

find_package(flatbuffers CONFIG REQUIRED)

# See:  https://github.com/emscripten-core/emscripten/blob/main/src/settings.js
string(REPLACE ";" " " CPP_FLAGS "${EM_CPP_FLAGS}")

set(EM_LINK_FLAGS 
    ${EM_LINK_FLAGS}
    "-sEXPORT_NAME='${CMAKE_PROJECT_NAME}'"
    "-lembind"
    "-fwasm-exceptions"
    "--emit-tsd ${CMAKE_CURRENT_BINARY_DIR}/flatclib.d.ts"
)
string(REPLACE ";" " " LINK_FLAGS "${EM_LINK_FLAGS}")

include_directories(
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
    ${flatbuffers_DIR}/src
    ${flatbuffers_DIR}/grpc
)

add_executable(flatclib
    main.cpp
    util.cpp

    ${flatbuffers_DIR}/src/idl_parser.cpp
    ${flatbuffers_DIR}/src/idl_gen_text.cpp
    ${flatbuffers_DIR}/src/reflection.cpp
    ${flatbuffers_DIR}/src/util.cpp
  
    ${flatbuffers_DIR}/src/idl_gen_binary.cpp
    ${flatbuffers_DIR}/src/idl_gen_text.cpp
    ${flatbuffers_DIR}/src/idl_gen_cpp.cpp
    ${flatbuffers_DIR}/src/idl_gen_csharp.cpp
    ${flatbuffers_DIR}/src/idl_gen_dart.cpp
    ${flatbuffers_DIR}/src/idl_gen_kotlin.cpp
    ${flatbuffers_DIR}/src/idl_gen_kotlin_kmp.cpp
    ${flatbuffers_DIR}/src/idl_gen_go.cpp
    ${flatbuffers_DIR}/src/idl_gen_java.cpp
    ${flatbuffers_DIR}/src/idl_gen_ts.cpp
    ${flatbuffers_DIR}/src/idl_gen_php.cpp
    ${flatbuffers_DIR}/src/idl_gen_python.cpp
    ${flatbuffers_DIR}/src/idl_gen_lobster.cpp
    ${flatbuffers_DIR}/src/idl_gen_rust.cpp
    ${flatbuffers_DIR}/src/idl_gen_fbs.cpp
    ${flatbuffers_DIR}/src/idl_gen_grpc.cpp
    ${flatbuffers_DIR}/src/idl_gen_json_schema.cpp
    ${flatbuffers_DIR}/src/idl_gen_swift.cpp
    ${flatbuffers_DIR}/src/file_name_saving_file_manager.cpp
    ${flatbuffers_DIR}/src/file_binary_writer.cpp
    ${flatbuffers_DIR}/src/file_writer.cpp
    ${flatbuffers_DIR}/src/flatc.cpp
    ${flatbuffers_DIR}/src/binary_annotator.cpp
    ${flatbuffers_DIR}/src/annotated_binary_text_gen.cpp
    ${flatbuffers_DIR}/src/bfbs_gen_lua.cpp
    ${flatbuffers_DIR}/src/bfbs_gen_nim.cpp
    ${flatbuffers_DIR}/src/code_generators.cpp
    ${flatbuffers_DIR}/grpc/src/compiler/cpp_generator.cc
    ${flatbuffers_DIR}/grpc/src/compiler/go_generator.cc
    ${flatbuffers_DIR}/grpc/src/compiler/java_generator.cc
    ${flatbuffers_DIR}/grpc/src/compiler/python_generator.cc
    ${flatbuffers_DIR}/grpc/src/compiler/swift_generator.cc
    ${flatbuffers_DIR}/grpc/src/compiler/ts_generator.cc
  
 )

set_target_properties(flatclib PROPERTIES COMPILE_FLAGS "${CPP_FLAGS}")
set_target_properties(flatclib PROPERTIES LINK_FLAGS "${LINK_FLAGS}")

target_link_libraries(flatclib
    PRIVATE flatbuffers::flatbuffers
)
