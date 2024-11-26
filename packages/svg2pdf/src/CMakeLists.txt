project(svg2pdflib)

add_custom_command(
    OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/../target/wasm32-wasip1/release/svg2pdflib.wasm
    COMMAND cargo component build --release
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/..
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/lib.rs ${CMAKE_CURRENT_SOURCE_DIR}/../wit/world.wit
    COMMENT "Custom build step to generate a file"
)

add_custom_target(
    svg2pdflib_rust ALL
    DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/../target/wasm32-wasip1/release/svg2pdflib.wasm
)
