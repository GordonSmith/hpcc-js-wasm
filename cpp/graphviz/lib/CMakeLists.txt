# No dependencies
ADD_SUBDIRECTORY(cdt)
ADD_SUBDIRECTORY(circogen)
ADD_SUBDIRECTORY(common)
ADD_SUBDIRECTORY(dotgen)
ADD_SUBDIRECTORY(fdpgen)
ADD_SUBDIRECTORY(ingraphs)
ADD_SUBDIRECTORY(label)
#ADD_SUBDIRECTORY(mingle)
ADD_SUBDIRECTORY(neatogen)
ADD_SUBDIRECTORY(ortho)
ADD_SUBDIRECTORY(osage)
ADD_SUBDIRECTORY(pack)
ADD_SUBDIRECTORY(patchwork)
ADD_SUBDIRECTORY(pathplan)
ADD_SUBDIRECTORY(rbtree)
ADD_SUBDIRECTORY(sparse)
ADD_SUBDIRECTORY(sfdpgen)
#ADD_SUBDIRECTORY(spine)
#ADD_SUBDIRECTORY(topfish)
ADD_SUBDIRECTORY(twopigen)
#ADD_SUBDIRECTORY(vmalloc)
ADD_SUBDIRECTORY(vpsc)
ADD_SUBDIRECTORY(xdot)

# Dependent on: cdt
ADD_SUBDIRECTORY(cgraph)

# Multiple dependencies
ADD_SUBDIRECTORY(gvc)
