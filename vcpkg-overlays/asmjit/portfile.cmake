vcpkg_from_github(
    OUT_SOURCE_PATH SOURCE_PATH
    REPO asmjit/asmjit
    REF c1019f1642a588107148f64ba54584b0ae3ec8d1
    SHA512 594b3b0ec6ed1bca4f7b35984187f53e1549555ba9f415bbe595c226845f86b11ae645b05df9343f8dea94a795f781b2e4bac9803aa8a586a83bbb22b6e4d383
    HEAD_REF master
)

vcpkg_cmake_configure(
    SOURCE_PATH "${SOURCE_PATH}"
    OPTIONS
        ASMJIT_STATIC
        ASMJIT_NO_DEPRECATED
        ASMJIT_NO_BUILDER
        ASMJIT_NO_COMPILER
        ASMJIT_NO_JIT
        ASMJIT_NO_LOGGING
        ASMJIT_NO_TEXT
        ASMJIT_NO_VALIDATION
        ASMJIT_NO_INTROSPECTION
        ASMJIT_NO_INTRINSICS
        ASMJIT_NO_AARCH64
        ASMJIT_NO_AARCH32
    MAYBE_UNUSED_VARIABLES
)
vcpkg_cmake_install()
vcpkg_copy_pdbs()
vcpkg_fixup_pkgconfig()
vcpkg_cmake_config_fixup(
    CONFIG_PATH "lib/cmake/${PORT}"
)

file(COPY "${SOURCE_PATH}" DESTINATION "${CURRENT_PACKAGES_DIR}/share/${PORT}/src" FILES_MATCHING PATTERN "*")
file(REMOVE_RECURSE "${CURRENT_PACKAGES_DIR}/debug/include")
file(INSTALL "${SOURCE_PATH}/LICENSE.md" DESTINATION "${CURRENT_PACKAGES_DIR}/share/${PORT}" RENAME copyright)
