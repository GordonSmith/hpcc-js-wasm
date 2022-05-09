PROJECT(Base91Module)

find_package(unofficial-base91 CONFIG REQUIRED)

SET(EM_FLAGS "${EM_COMMON_FLAGS} -s INCOMING_MODULE_JS_API=\"[]\" -s EXPORTED_FUNCTIONS=\"['_malloc']\" -s EXPORT_NAME='${PROJECT_NAME}' --pre-js ${CMAKE_CURRENT_SOURCE_DIR}/src/pre.js --post-js ${CMAKE_CURRENT_BINARY_DIR}/main_glue.js")

#  Generate Glue from IDL file  ---
ADD_CUSTOM_COMMAND(
    MAIN_DEPENDENCY ${CMAKE_CURRENT_SOURCE_DIR}/src-cpp/main.idl
    OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/main_glue.js ${CMAKE_CURRENT_BINARY_DIR}/main_glue.cpp
    COMMAND python3 ${EMSDK_DIR}/upstream/emscripten/tools/webidl_binder.py ${CMAKE_CURRENT_SOURCE_DIR}/src-cpp/main.idl ${CMAKE_CURRENT_BINARY_DIR}/main_glue
)
SET_PROPERTY(SOURCE src-cpp/main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_CURRENT_BINARY_DIR}/main_glue.cpp)
#  ---  ---  ---

INCLUDE_DIRECTORIES(
    base91lib
    UtilModule
    ${VCPKG_INCLUDE_DIR}
    ${CMAKE_CURRENT_BINARY_DIR}
)

SET(SRCS
    src-cpp/main.cpp
)

SET(LIBS
    base91lib  
    UtilModule  
    unofficial::base91::base91
)

ADD_EXECUTABLE(base91 ${SRCS})

SET_TARGET_PROPERTIES(base91 PROPERTIES LINK_FLAGS "-s ENVIRONMENT=web,worker ${EM_FLAGS}")

TARGET_LINK_LIBRARIES(base91
    ${LIBS}
)

INSTALL(FILES 
    ${CMAKE_CURRENT_BINARY_DIR}/base91.wasm
    DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/dist
    COMPONENT runtime
)
