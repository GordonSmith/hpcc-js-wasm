#include <boost/config.hpp>
#include <iostream>
#include <boost/graph/subgraph.hpp>
#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/graph_utility.hpp>

using namespace boost;

#include <string>

const char *const version = "0.6.0";

class DirectedGraph
{
    typedef property<vertex_color_t, int, property<vertex_name_t, std::string>> VertexProperty;
    typedef subgraph<adjacency_list<vecS, vecS, directedS, VertexProperty, property<edge_index_t, int>>> Graph;

protected:
    Graph g;

public:
    DirectedGraph()
    {
    }

    static void *malloc(size_t __size)
    {
        return ::malloc(__size);
    }

    static void free(void *__ptr)
    {
        ::free(__ptr);
    }

    const char *version()
    {
        return ::version;
    }
};

//  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---

void embeddingMain(const std::vector<std::string> &args, std::vector<std::string> &retVal)
{
}

#include <emscripten/bind.h>
EMSCRIPTEN_BINDINGS(boost_graph)
{
}
