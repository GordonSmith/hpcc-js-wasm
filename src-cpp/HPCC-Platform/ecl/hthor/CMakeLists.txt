################################################################################
#    HPCC SYSTEMS software Copyright (C) 2012 HPCC Systems®.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
################################################################################


# Component: hthorlib

#####################################################
# Description:
# ------------
#    Cmake Input File for hthorlib
#####################################################


project( hthorlib )

set(HTHOR_DIR ${HPCC_SOURCE_DIR}/ecl/hthor)

set (    SRCS
         ${HTHOR_DIR}/hthor.cpp
         ${HTHOR_DIR}/hthorkey.cpp
         ${HTHOR_DIR}/hthorstep.cpp
         ${HTHOR_DIR}/../eclagent/eclagent.cpp
         ${HTHOR_DIR}/../eclagent/eclgraph.cpp
         ${HTHOR_DIR}/sourcedoc.xml
    )

set (    INCLUDES
         ${HTHOR_DIR}/hthor.ipp
         ${HTHOR_DIR}/hthor.hpp
         ${HTHOR_DIR}/hthorstep.ipp
         ${HTHOR_DIR}/../eclagent/agentctx.hpp
         ${HTHOR_DIR}/../eclagent/eclagent.ipp
    )

message("${HPCC_SOURCE_DIR}/ecl/eclagent <-------------------------------------------")
include_directories (
         ${HTHOR_DIR}
         ${HPCC_SOURCE_DIR}/common/remote
         ${HPCC_SOURCE_DIR}/esp/clients/ws_dfsclient
         ${HPCC_SOURCE_DIR}/common/deftype
         ${HPCC_SOURCE_DIR}/common/dllserver
         ${HPCC_SOURCE_DIR}/common/environment
         ${HPCC_SOURCE_DIR}/common/thorhelper
         ${HPCC_SOURCE_DIR}/common/workunit
         ${HPCC_SOURCE_DIR}/common/wuanalysis
         ${HPCC_SOURCE_DIR}/dali/base
         ${HPCC_SOURCE_DIR}/dali/ft
         ${HPCC_SOURCE_DIR}/ecl/eclagent
         ${HPCC_SOURCE_DIR}/ecl/hql
         ${HPCC_SOURCE_DIR}/ecl/schedulectrl
         ${HPCC_SOURCE_DIR}/fs/dafsclient
         ${HPCC_SOURCE_DIR}/roxie/ccd
         ${HPCC_SOURCE_DIR}/roxie/roxie
         ${HPCC_SOURCE_DIR}/roxie/roxiemem
         ${HPCC_SOURCE_DIR}/rtl/eclrtl
         ${HPCC_SOURCE_DIR}/rtl/include
         ${HPCC_SOURCE_DIR}/system/hrpc
         ${HPCC_SOURCE_DIR}/system/include
         ${HPCC_SOURCE_DIR}/system/jlib
         ${HPCC_SOURCE_DIR}/system/jhtree
         ${HPCC_SOURCE_DIR}/system/mp
         ${HPCC_SOURCE_DIR}/system/security/shared
         ${CMAKE_BINARY_DIR}
         ${CMAKE_BINARY_DIR}/oss
    )

SET (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${STRICT_CXX_FLAGS}")

ADD_DEFINITIONS( -D_USRDLL -DHTHOR_EXPORTS -DSTARTQUERY_EXPORTS )

add_library( hthorlib ${SRCS} ${INCLUDES} )
# install ( TARGETS hthorlib RUNTIME DESTINATION ${EXEC_DIR} LIBRARY DESTINATION ${LIB_DIR} ARCHIVE DESTINATION componentfiles/cl/lib )
# target_link_libraries ( hthorlib
#          dafsclient
#          dalibase
#          dllserver
#          eclrtl
#          deftype
#          hrpc
#          jhtree
#          jlib
#          mp
#          nbcd
#          roxiemem
#          schedulectrl
#          thorhelper
#          workunit
#          ws_dfsclient
#          wuanalysis
#     )

if (NOT CONTAINERIZED)
    target_link_libraries ( hthorlib environment )
endif()

IF (USE_OPENSSL)
    target_link_libraries ( hthorlib
    	securesocket
    )
ENDIF()
