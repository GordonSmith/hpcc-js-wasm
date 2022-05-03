#!/bin/bash
SCRIPT=`realpath $0`
SCRIPTPATH=`dirname $SCRIPT`
source $SCRIPTPATH/../emsdk/emsdk_env.sh    # or whatever other script you want to have executed
cmake "$@"                                  # don't forget to forward the passed parameters
