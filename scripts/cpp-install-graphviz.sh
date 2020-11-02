#!/bin/bash

if [ ! -d "src-graphviz" ] 
then
    wget -c https://gitlab.com/graphviz/graphviz/-/archive/master/graphviz-master.tar.gz
    mkdir ./src-graphviz
    tar -xzf ./graphviz-master.tar.gz -C ./src-graphviz --strip-components=1
    rm ./graphviz-master.tar.gz

    #  Configure  ---
    cd ./src-graphviz
    ./autogen.sh
    ./configure

    #  Generate grammar files (and others)  ---
    mkdir ./build
    cd ./build
    cmake ..
    cmake --build . -- -j
    cd ..

    cd ..
fi
