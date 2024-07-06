vcpkg_from_github(
    OUT_SOURCE_PATH SOURCE_PATH
    REPO ggerganov/llama.cpp
    REF "${VERSION}"
    SHA512 2e0e02b8001c69f16f980a11544622c14cba1fc53d0b2a5afe24bbe8123b08af7c526701446f60c6a475dbae1615f2df3116aadb8f96cd474a8716ab7d19c1dc
    HEAD_REF master
)

vcpkg_cmake_configure(
    SOURCE_PATH "${SOURCE_PATH}"
)

vcpkg_cmake_install()

vcpkg_copy_pdbs()
vcpkg_cmake_config_fixup(CONFIG_PATH "lib/cmake/Llama")

file(INSTALL ${SOURCE_PATH}/common DESTINATION ${CURRENT_PACKAGES_DIR}/share/${PORT})

file(REMOVE_RECURSE "${CURRENT_PACKAGES_DIR}/debug/include")
file(INSTALL ${SOURCE_PATH}/LICENSE DESTINATION ${CURRENT_PACKAGES_DIR}/share/${PORT} RENAME copyright)
