INCLUDE_DIRECTORIES(
    ${GRAPHVIZSRC_DIRS}/plugin/neato_layout
    ${GRAPHVIZ_LIB_DIR}/cdt
    ${GRAPHVIZ_LIB_DIR}/cgraph
    ${GRAPHVIZ_LIB_DIR}/common
    ${GRAPHVIZ_LIB_DIR}/gvc
    ${GRAPHVIZ_LIB_DIR}/pathplan
)

ADD_LIBRARY(gvplugin_neato_layout STATIC
    # Source files
    ${GRAPHVIZSRC_DIRS}/plugin/neato_layout/gvplugin_neato_layout.c
    ${GRAPHVIZSRC_DIRS}/plugin/neato_layout/gvlayout_neato_layout.c
)

TARGET_LINK_LIBRARIES(gvplugin_neato_layout
    cdt
    cgraph
    circogen
    fdpgen
    gvc
    neatogen
    osage
    patchwork
    pathplan
    rbtree
    sparse
    twopigen
    
    #  with_ipsepcola
    vpsc

    #  with_sfdp
    sfdpgen
)

