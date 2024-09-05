project (hello LANGUAGES C ASM)

include_directories(
    "${CMAKE_SOURCE_DIR}/node_modules/emnapi/include/node"
    "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api"
    "${CMAKE_SOURCE_DIR}/build/vcpkg_installed/wasm32-emscripten/include"
)

add_executable(hello "${CMAKE_SOURCE_DIR}/build/vcpkg_installed/wasm32-emscripten/share/usearch/lib.cpp")

target_link_libraries(hello emnapi)

target_link_options(hello PRIVATE
    "-sEXPORTED_FUNCTIONS=['_napi_register_wasm_v1','_node_api_module_get_api_version_v1','_malloc','_free']"
)