/**
 * Java bridge for graphviz — compiled as standalone WASI WebAssembly.
 *
 * This module exposes a minimal C API suitable for use from JVM runtimes
 * (e.g. Endive) via plain linear-memory pointer passing.  It intentionally
 * avoids Emscripten embind so it can be loaded without a JavaScript runtime.
 *
 * Exported functions:
 *   graphviz_malloc(size)                                          -> ptr
 *   graphviz_free(ptr)
 *   graphviz_version(out)                                          -> len
 *   graphviz_layout(src, srcLen, format, formatLen, engine, engLen) -> resultLen (< 0 on error)
 *   graphviz_get_result_ptr()                                      -> ptr
 *   graphviz_last_error(out)                                       -> len
 */

#include <gvc.h>
#include <gvplugin.h>
#include <graphviz_version.h>

#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>

// ---------------------------------------------------------------------------
// Plugin table — mirrors the subset used by main.cpp for text-format rendering.
// ---------------------------------------------------------------------------
extern gvplugin_library_t gvplugin_dot_layout_LTX_library;
extern gvplugin_library_t gvplugin_neato_layout_LTX_library;
extern gvplugin_library_t gvplugin_core_LTX_library;

lt_symlist_t lt_preloaded_symbols[] = {
    {"gvplugin_dot_layout_LTX_library",   &gvplugin_dot_layout_LTX_library},
    {"gvplugin_neato_layout_LTX_library", &gvplugin_neato_layout_LTX_library},
    {"gvplugin_core_LTX_library",         &gvplugin_core_LTX_library},
    {0, 0}
};

// ---------------------------------------------------------------------------
// Module-level result buffers (per WASM instance, so effectively per-thread
// when each Java Graphviz instance holds its own Endive Instance).
// ---------------------------------------------------------------------------
namespace {
    std::string g_result;
    std::string g_error;

    int errorHandler(char* buf)
    {
        g_error = buf ? buf : "";
        return 0;
    }

    // -----------------------------------------------------------------------
    // CGraph / CSubgraph helpers
    // -----------------------------------------------------------------------

    static std::string jsonStr(const char *s)
    {
        std::string out;
        out += '"';
        for (; s && *s; ++s)
        {
            const unsigned char c = static_cast<unsigned char>(*s);
            if      (c == '"')  { out += "\\\""; }
            else if (c == '\\') { out += "\\\\"; }
            else if (c == '\n') { out += "\\n";  }
            else if (c == '\r') { out += "\\r";  }
            else if (c == '\t') { out += "\\t";  }
            else if (c < 0x20)
            {
                static const char hex[] = "0123456789abcdef";
                out += "\\u00";
                out += hex[(c >> 4) & 0xf];
                out += hex[c & 0xf];
            }
            else { out += static_cast<char>(c); }
        }
        out += '"';
        return out;
    }

    /** Store s in g_result and return its byte length. */
    static int storeResult(const std::string &s)
    {
        g_result = s;
        return static_cast<int>(g_result.size());
    }

    /** Build a std::string from a (ptr, len) pair sent from Java. */
    static std::string toStr(void *ptr, int len)
    {
        return std::string(static_cast<char *>(ptr), static_cast<std::size_t>(len));
    }

    /** Reinterpret an int32 handle as an Agraph_t*. Safe on wasm32. */
    static Agraph_t *toGraph(int32_t h)
    {
        return reinterpret_cast<Agraph_t *>(static_cast<uintptr_t>(h));
    }

    /** Pack an Agraph_t* into an int32 handle. Safe on wasm32. */
    static int32_t toHandle(Agraph_t *g)
    {
        return static_cast<int32_t>(reinterpret_cast<uintptr_t>(g));
    }

    /**
     * Serialize graph g to a DOT-language string using open_memstream so that
     * no real filesystem access is required (avoids the missing path_open WASI
     * call that TempFileBuffer would trigger).
     */
    static std::string graphToDot(Agraph_t *g)
    {
        char *buf = nullptr;
        std::size_t size = 0;
        FILE *f = open_memstream(&buf, &size);
        if (!f) return "";
        agwrite(g, f);
        std::fclose(f);
        std::string result(buf, size);
        ::free(buf);
        return result;
    }

    // JSON [tail,head,key,...] flat-triple edge-list helpers.

    static std::string edgeTriples(Agraph_t *g)
    {
        std::string result = "[";
        bool first = true;
        for (Agnode_t *n = agfstnode(g); n; n = agnxtnode(g, n))
            for (Agedge_t *e = agfstout(g, n); e; e = agnxtout(g, e))
            {
                if (agtail(e) != n) continue;
                const char *k = agnameof(e);
                if (!first) result += ',';
                result += jsonStr(agnameof(agtail(e))); result += ',';
                result += jsonStr(agnameof(aghead(e))); result += ',';
                result += jsonStr(k ? k : "");
                first = false;
            }
        result += ']';
        return result;
    }

    static std::string outEdgeTriples(Agraph_t *g, const std::string &node)
    {
        std::string result = "[";
        bool first = true;
        Agnode_t *n = agnode(g, const_cast<char *>(node.c_str()), 0);
        if (n)
            for (Agedge_t *e = agfstout(g, n); e; e = agnxtout(g, e))
            {
                const char *k = agnameof(e);
                if (!first) result += ',';
                result += jsonStr(agnameof(agtail(e))); result += ',';
                result += jsonStr(agnameof(aghead(e))); result += ',';
                result += jsonStr(k ? k : "");
                first = false;
            }
        result += ']';
        return result;
    }

    static std::string inEdgeTriples(Agraph_t *g, const std::string &node)
    {
        std::string result = "[";
        bool first = true;
        Agnode_t *n = agnode(g, const_cast<char *>(node.c_str()), 0);
        if (n)
            for (Agedge_t *e = agfstin(g, n); e; e = agnxtin(g, e))
            {
                const char *k = agnameof(e);
                if (!first) result += ',';
                result += jsonStr(agnameof(agtail(e))); result += ',';
                result += jsonStr(agnameof(aghead(e))); result += ',';
                result += jsonStr(k ? k : "");
                first = false;
            }
        result += ']';
        return result;
    }

    static std::string nodeEdgeTriples(Agraph_t *g, const std::string &node)
    {
        std::string result = "[";
        bool first = true;
        Agnode_t *n = agnode(g, const_cast<char *>(node.c_str()), 0);
        if (n)
            for (Agedge_t *e = agfstedge(g, n); e; e = agnxtedge(g, e, n))
            {
                const char *k = agnameof(e);
                if (!first) result += ',';
                result += jsonStr(agnameof(agtail(e))); result += ',';
                result += jsonStr(agnameof(aghead(e))); result += ',';
                result += jsonStr(k ? k : "");
                first = false;
            }
        result += ']';
        return result;
    }
} // namespace

extern "C" {

__attribute__((export_name("graphviz_malloc")))
void* graphviz_malloc(int size)
{
    return ::malloc(static_cast<std::size_t>(size));
}

__attribute__((export_name("graphviz_free")))
void graphviz_free(void* ptr)
{
    ::free(ptr);
}

/**
 * Write the Graphviz library version string into caller-provided buffer.
 *
 * @param out  Buffer; caller must allocate at least 32 bytes.
 * @return Number of bytes written (ASCII, not null-terminated).
 */
__attribute__((export_name("graphviz_version")))
int graphviz_version(void* out)
{
    const char* v = PACKAGE_VERSION;
    int len = static_cast<int>(::strlen(v));
    ::memcpy(out, v, static_cast<std::size_t>(len));
    return len;
}

/**
 * Render a DOT-language graph to the requested output format.
 *
 * All string arguments are raw bytes paired with an explicit length; the
 * Java caller does not need to null-terminate them.
 *
 * The rendered output is stored internally and can be retrieved via
 * graphviz_get_result_ptr() until the next call to graphviz_layout().
 *
 * @param src       DOT source bytes.
 * @param src_len   Length of src.
 * @param format    Output format string (e.g. "svg", "dot", "plain").
 * @param fmt_len   Length of format.
 * @param engine    Layout engine (e.g. "dot", "neato", "circo").
 * @param eng_len   Length of engine.
 * @return          Number of bytes in the result, or -1 on error.
 */
__attribute__((export_name("graphviz_layout")))
int graphviz_layout(void* src,    int src_len,
                    void* format, int fmt_len,
                    void* engine, int eng_len)
{
    g_result.clear();
    g_error.clear();

    std::string src_str(static_cast<char*>(src),    static_cast<std::size_t>(src_len));
    std::string fmt_str(static_cast<char*>(format), static_cast<std::size_t>(fmt_len));
    std::string eng_str(static_cast<char*>(engine), static_cast<std::size_t>(eng_len));

    agseterr(AGERR);
    agseterrf(errorHandler);

    GVC_t*    gvc   = gvContextPlugins(lt_preloaded_symbols, true);
    Agraph_t* graph = agmemread(src_str.c_str());
    int result_len  = -1;

    if (graph) {
        char*       data   = nullptr;
        std::size_t length = 0;

        gvLayout(gvc, graph, eng_str.c_str());
        gvRenderData(gvc, graph, fmt_str.c_str(), &data, &length);

        if (data) {
            // Assign from the null-terminated C string; works for all text
            // formats (SVG, DOT, plain, etc.).  Binary formats are not
            // supported in the Java bridge.
            g_result = data;
            gvFreeRenderData(data);
            result_len = static_cast<int>(g_result.size());
        }

        gvFreeLayout(gvc, graph);
        agclose(graph);
    }

    gvFinalize(gvc);
    gvFreeContext(gvc);

    return result_len;
}

/**
 * Returns a pointer into WASM linear memory pointing to the rendered output
 * from the most recent successful graphviz_layout() call.
 *
 * Valid until the next call to graphviz_layout().
 */
__attribute__((export_name("graphviz_get_result_ptr")))
const void* graphviz_get_result_ptr()
{
    return g_result.data();
}

/**
 * Copies the last error message into a caller-provided buffer.
 *
 * @param out  Buffer; caller must allocate at least 4096 bytes.
 * @return Number of bytes written (0 if no error occurred).
 */
__attribute__((export_name("graphviz_last_error")))
int graphviz_last_error(void* out)
{
    int len = static_cast<int>(g_error.size());
    if (len > 0)
        ::memcpy(out, g_error.data(), static_cast<std::size_t>(len));
    return len;
}

} // extern "C"

// ============================================================================
// CGraph / CSubgraph C bridge
//
// Handles are Agraph_t* pointers packed into int32_t (wasm32 pointers are
// 32-bit so this is always safe).  CSubgraph handles are also Agraph_t*
// (cgraph subgraphs share the same type as root graphs); the parent CGraph
// owns the memory — csubgraph functions never free the underlying Agraph_t.
//
// All string arguments are passed as (void* ptr, int len) pairs so the Java
// caller does not need to null-terminate them.  Return values that are
// strings are stored in g_result; the Java side reads them immediately via
// graphviz_get_result_ptr() + the returned length.
// ============================================================================
extern "C" {

// ---------------------------------------------------------------------------
// CGraph lifecycle
// ---------------------------------------------------------------------------

__attribute__((export_name("cgraph_create")))
int32_t cgraph_create(void *name_ptr, int name_len, int directed, int strict)
{
    Agdesc_t type;
    if      (directed && strict) type = Agstrictdirected;
    else if (directed)           type = Agdirected;
    else if (strict)             type = Agstrictundirected;
    else                         type = Agundirected;
    std::string name = toStr(name_ptr, name_len);
    Agraph_t *g = agopen(const_cast<char *>(name.c_str()), type, nullptr);
    return toHandle(g);
}

__attribute__((export_name("cgraph_destroy")))
void cgraph_destroy(int32_t handle)
{
    Agraph_t *g = toGraph(handle);
    if (g) agclose(g);
}

__attribute__((export_name("cgraph_to_dot")))
int cgraph_to_dot(int32_t handle)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return storeResult("");
    return storeResult(graphToDot(g));
}

__attribute__((export_name("cgraph_layout")))
int cgraph_layout(int32_t handle,
                  void *fmt_ptr, int fmt_len,
                  void *eng_ptr, int eng_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return -1;
    std::string fmt = toStr(fmt_ptr, fmt_len);
    std::string eng = toStr(eng_ptr, eng_len);
    g_error.clear();
    agseterr(AGERR);
    agseterrf(errorHandler);
    GVC_t *gvc = gvContextPlugins(lt_preloaded_symbols, true);
    char *data = nullptr;
    std::size_t length = 0;
    gvLayout(gvc, g, eng.c_str());
    gvRenderData(gvc, g, fmt.c_str(), &data, &length);
    int result_len = -1;
    if (data)
    {
        g_result = data;
        gvFreeRenderData(data);
        result_len = static_cast<int>(g_result.size());
    }
    gvFreeLayout(gvc, g);
    gvFinalize(gvc);
    gvFreeContext(gvc);
    return result_len;
}

// ---------------------------------------------------------------------------
// CGraph mutation
// ---------------------------------------------------------------------------

__attribute__((export_name("cgraph_add_node")))
void cgraph_add_node(int32_t handle, void *name_ptr, int name_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return;
    std::string name = toStr(name_ptr, name_len);
    agnode(g, const_cast<char *>(name.c_str()), 1);
}

__attribute__((export_name("cgraph_add_edge")))
void cgraph_add_edge(int32_t handle,
                     void *tail_ptr, int tail_len,
                     void *head_ptr, int head_len,
                     void *key_ptr,  int key_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return;
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    Agnode_t *t = agnode(g, const_cast<char *>(tail.c_str()), 1);
    Agnode_t *h = agnode(g, const_cast<char *>(head.c_str()), 1);
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    agedge(g, t, h, k, 1);
}

__attribute__((export_name("cgraph_set_graph_attr")))
void cgraph_set_graph_attr(int32_t handle,
                           void *attr_ptr, int attr_len,
                           void *val_ptr,  int val_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return;
    std::string attr = toStr(attr_ptr, attr_len);
    std::string val  = toStr(val_ptr,  val_len);
    agsafeset(g,
              const_cast<char *>(attr.c_str()),
              const_cast<char *>(val.c_str()),
              const_cast<char *>(val.c_str()));
}

__attribute__((export_name("cgraph_set_node_attr")))
void cgraph_set_node_attr(int32_t handle,
                          void *node_ptr, int node_len,
                          void *attr_ptr, int attr_len,
                          void *val_ptr,  int val_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return;
    std::string node = toStr(node_ptr, node_len);
    std::string attr = toStr(attr_ptr, attr_len);
    std::string val  = toStr(val_ptr,  val_len);
    Agnode_t *n = agnode(g, const_cast<char *>(node.c_str()), 0);
    if (n)
        agsafeset(n,
                  const_cast<char *>(attr.c_str()),
                  const_cast<char *>(val.c_str()),
                  "");
}

__attribute__((export_name("cgraph_set_edge_attr")))
void cgraph_set_edge_attr(int32_t handle,
                          void *tail_ptr, int tail_len,
                          void *head_ptr, int head_len,
                          void *key_ptr,  int key_len,
                          void *attr_ptr, int attr_len,
                          void *val_ptr,  int val_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return;
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    std::string attr = toStr(attr_ptr, attr_len);
    std::string val  = toStr(val_ptr,  val_len);
    Agnode_t *t = agnode(g, const_cast<char *>(tail.c_str()), 0);
    Agnode_t *h = agnode(g, const_cast<char *>(head.c_str()), 0);
    if (!t || !h) return;
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    Agedge_t *e = agedge(g, t, h, k, 0);
    if (e)
        agsafeset(e,
                  const_cast<char *>(attr.c_str()),
                  const_cast<char *>(val.c_str()),
                  "");
}

__attribute__((export_name("cgraph_remove_node")))
void cgraph_remove_node(int32_t handle, void *name_ptr, int name_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return;
    std::string name = toStr(name_ptr, name_len);
    Agnode_t *n = agnode(g, const_cast<char *>(name.c_str()), 0);
    if (n) agdelnode(g, n);
}

__attribute__((export_name("cgraph_remove_edge")))
void cgraph_remove_edge(int32_t handle,
                        void *tail_ptr, int tail_len,
                        void *head_ptr, int head_len,
                        void *key_ptr,  int key_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return;
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    Agnode_t *t = agnode(g, const_cast<char *>(tail.c_str()), 0);
    Agnode_t *h = agnode(g, const_cast<char *>(head.c_str()), 0);
    if (!t || !h) return;
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    Agedge_t *e = agedge(g, t, h, k, 0);
    if (e) agdeledge(g, e);
}

__attribute__((export_name("cgraph_remove_subgraph")))
void cgraph_remove_subgraph(int32_t handle, void *name_ptr, int name_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return;
    std::string name = toStr(name_ptr, name_len);
    Agraph_t *sg = agsubg(g, const_cast<char *>(name.c_str()), 0);
    if (sg) agdelsubg(g, sg);
}

// ---------------------------------------------------------------------------
// CGraph queries
// ---------------------------------------------------------------------------

__attribute__((export_name("cgraph_has_node")))
int cgraph_has_node(int32_t handle, void *name_ptr, int name_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return 0;
    std::string name = toStr(name_ptr, name_len);
    return agnode(g, const_cast<char *>(name.c_str()), 0) ? 1 : 0;
}

__attribute__((export_name("cgraph_has_edge")))
int cgraph_has_edge(int32_t handle,
                    void *tail_ptr, int tail_len,
                    void *head_ptr, int head_len,
                    void *key_ptr,  int key_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return 0;
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    Agnode_t *t = agnode(g, const_cast<char *>(tail.c_str()), 0);
    Agnode_t *h = agnode(g, const_cast<char *>(head.c_str()), 0);
    if (!t || !h) return 0;
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    return agedge(g, t, h, k, 0) ? 1 : 0;
}

__attribute__((export_name("cgraph_has_subgraph")))
int cgraph_has_subgraph(int32_t handle, void *name_ptr, int name_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return 0;
    std::string name = toStr(name_ptr, name_len);
    return agsubg(g, const_cast<char *>(name.c_str()), 0) ? 1 : 0;
}

__attribute__((export_name("cgraph_node_count")))
int cgraph_node_count(int32_t handle)
{
    Agraph_t *g = toGraph(handle);
    return g ? agnnodes(g) : 0;
}

__attribute__((export_name("cgraph_edge_count")))
int cgraph_edge_count(int32_t handle)
{
    Agraph_t *g = toGraph(handle);
    return g ? agnedges(g) : 0;
}

__attribute__((export_name("cgraph_subgraph_count")))
int cgraph_subgraph_count(int32_t handle)
{
    Agraph_t *g = toGraph(handle);
    return g ? agnsubg(g) : 0;
}

__attribute__((export_name("cgraph_get_graph_attr")))
int cgraph_get_graph_attr(int32_t handle, void *attr_ptr, int attr_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return storeResult("");
    std::string attr = toStr(attr_ptr, attr_len);
    char *val = agget(g, const_cast<char *>(attr.c_str()));
    return storeResult(val ? val : "");
}

__attribute__((export_name("cgraph_get_node_attr")))
int cgraph_get_node_attr(int32_t handle,
                         void *node_ptr, int node_len,
                         void *attr_ptr, int attr_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return storeResult("");
    std::string node = toStr(node_ptr, node_len);
    std::string attr = toStr(attr_ptr, attr_len);
    Agnode_t *n = agnode(g, const_cast<char *>(node.c_str()), 0);
    if (!n) return storeResult("");
    char *val = agget(n, const_cast<char *>(attr.c_str()));
    return storeResult(val ? val : "");
}

__attribute__((export_name("cgraph_get_edge_attr")))
int cgraph_get_edge_attr(int32_t handle,
                         void *tail_ptr, int tail_len,
                         void *head_ptr, int head_len,
                         void *key_ptr,  int key_len,
                         void *attr_ptr, int attr_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return storeResult("");
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    std::string attr = toStr(attr_ptr, attr_len);
    Agnode_t *t = agnode(g, const_cast<char *>(tail.c_str()), 0);
    Agnode_t *h = agnode(g, const_cast<char *>(head.c_str()), 0);
    if (!t || !h) return storeResult("");
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    Agedge_t *e = agedge(g, t, h, k, 0);
    if (!e) return storeResult("");
    char *val = agget(e, const_cast<char *>(attr.c_str()));
    return storeResult(val ? val : "");
}

// ---------------------------------------------------------------------------
// CGraph traversal
// ---------------------------------------------------------------------------

__attribute__((export_name("cgraph_node_names")))
int cgraph_node_names(int32_t handle)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return storeResult("[]");
    std::string result = "[";
    bool first = true;
    for (Agnode_t *n = agfstnode(g); n; n = agnxtnode(g, n))
    {
        if (!first) result += ',';
        result += jsonStr(agnameof(n));
        first = false;
    }
    result += ']';
    return storeResult(result);
}

__attribute__((export_name("cgraph_subgraph_names")))
int cgraph_subgraph_names(int32_t handle)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return storeResult("[]");
    std::string result = "[";
    bool first = true;
    for (Agraph_t *sg = agfstsubg(g); sg; sg = agnxtsubg(sg))
    {
        if (!first) result += ',';
        result += jsonStr(agnameof(sg));
        first = false;
    }
    result += ']';
    return storeResult(result);
}

__attribute__((export_name("cgraph_edges")))
int cgraph_edges(int32_t handle)
{
    Agraph_t *g = toGraph(handle);
    return storeResult(g ? edgeTriples(g) : "[]");
}

__attribute__((export_name("cgraph_out_edges")))
int cgraph_out_edges(int32_t handle, void *node_ptr, int node_len)
{
    Agraph_t *g = toGraph(handle);
    return storeResult(g ? outEdgeTriples(g, toStr(node_ptr, node_len)) : "[]");
}

__attribute__((export_name("cgraph_in_edges")))
int cgraph_in_edges(int32_t handle, void *node_ptr, int node_len)
{
    Agraph_t *g = toGraph(handle);
    return storeResult(g ? inEdgeTriples(g, toStr(node_ptr, node_len)) : "[]");
}

__attribute__((export_name("cgraph_node_edges")))
int cgraph_node_edges(int32_t handle, void *node_ptr, int node_len)
{
    Agraph_t *g = toGraph(handle);
    return storeResult(g ? nodeEdgeTriples(g, toStr(node_ptr, node_len)) : "[]");
}

// ---------------------------------------------------------------------------
// CSubgraph management (subgraph handle is also Agraph_t*; owned by parent)
// ---------------------------------------------------------------------------

__attribute__((export_name("cgraph_add_subgraph")))
int32_t cgraph_add_subgraph(int32_t handle, void *name_ptr, int name_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return 0;
    std::string name = toStr(name_ptr, name_len);
    Agraph_t *sg = agsubg(g, const_cast<char *>(name.c_str()), 1);
    return toHandle(sg);
}

__attribute__((export_name("cgraph_get_subgraph")))
int32_t cgraph_get_subgraph(int32_t handle, void *name_ptr, int name_len)
{
    Agraph_t *g = toGraph(handle);
    if (!g) return 0;
    std::string name = toStr(name_ptr, name_len);
    Agraph_t *sg = agsubg(g, const_cast<char *>(name.c_str()), 0);
    return toHandle(sg); // 0 (null) if not found
}

// ---------------------------------------------------------------------------
// CSubgraph mutation
// ---------------------------------------------------------------------------

__attribute__((export_name("csubgraph_add_node")))
void csubgraph_add_node(int32_t sg_handle, void *name_ptr, int name_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return;
    std::string name = toStr(name_ptr, name_len);
    agnode(sg, const_cast<char *>(name.c_str()), 1);
}

__attribute__((export_name("csubgraph_add_edge")))
void csubgraph_add_edge(int32_t sg_handle,
                        void *tail_ptr, int tail_len,
                        void *head_ptr, int head_len,
                        void *key_ptr,  int key_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return;
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    Agnode_t *t = agnode(sg, const_cast<char *>(tail.c_str()), 1);
    Agnode_t *h = agnode(sg, const_cast<char *>(head.c_str()), 1);
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    agedge(sg, t, h, k, 1);
}

__attribute__((export_name("csubgraph_set_attr")))
void csubgraph_set_attr(int32_t sg_handle,
                        void *attr_ptr, int attr_len,
                        void *val_ptr,  int val_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return;
    std::string attr = toStr(attr_ptr, attr_len);
    std::string val  = toStr(val_ptr,  val_len);
    agsafeset(sg,
              const_cast<char *>(attr.c_str()),
              const_cast<char *>(val.c_str()),
              const_cast<char *>(val.c_str()));
}

__attribute__((export_name("csubgraph_set_node_attr")))
void csubgraph_set_node_attr(int32_t sg_handle,
                             void *node_ptr, int node_len,
                             void *attr_ptr, int attr_len,
                             void *val_ptr,  int val_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return;
    std::string node = toStr(node_ptr, node_len);
    std::string attr = toStr(attr_ptr, attr_len);
    std::string val  = toStr(val_ptr,  val_len);
    Agnode_t *n = agnode(sg, const_cast<char *>(node.c_str()), 0);
    if (n)
        agsafeset(n,
                  const_cast<char *>(attr.c_str()),
                  const_cast<char *>(val.c_str()),
                  "");
}

__attribute__((export_name("csubgraph_set_edge_attr")))
void csubgraph_set_edge_attr(int32_t sg_handle,
                             void *tail_ptr, int tail_len,
                             void *head_ptr, int head_len,
                             void *key_ptr,  int key_len,
                             void *attr_ptr, int attr_len,
                             void *val_ptr,  int val_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return;
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    std::string attr = toStr(attr_ptr, attr_len);
    std::string val  = toStr(val_ptr,  val_len);
    Agnode_t *t = agnode(sg, const_cast<char *>(tail.c_str()), 0);
    Agnode_t *h = agnode(sg, const_cast<char *>(head.c_str()), 0);
    if (!t || !h) return;
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    Agedge_t *e = agedge(sg, t, h, k, 0);
    if (e)
        agsafeset(e,
                  const_cast<char *>(attr.c_str()),
                  const_cast<char *>(val.c_str()),
                  "");
}

__attribute__((export_name("csubgraph_remove_node")))
void csubgraph_remove_node(int32_t sg_handle, void *name_ptr, int name_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return;
    std::string name = toStr(name_ptr, name_len);
    Agnode_t *n = agnode(sg, const_cast<char *>(name.c_str()), 0);
    if (n) agdelnode(sg, n);
}

__attribute__((export_name("csubgraph_remove_edge")))
void csubgraph_remove_edge(int32_t sg_handle,
                           void *tail_ptr, int tail_len,
                           void *head_ptr, int head_len,
                           void *key_ptr,  int key_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return;
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    Agnode_t *t = agnode(sg, const_cast<char *>(tail.c_str()), 0);
    Agnode_t *h = agnode(sg, const_cast<char *>(head.c_str()), 0);
    if (!t || !h) return;
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    Agedge_t *e = agedge(sg, t, h, k, 0);
    if (e) agdeledge(sg, e);
}

// ---------------------------------------------------------------------------
// CSubgraph queries
// ---------------------------------------------------------------------------

__attribute__((export_name("csubgraph_has_node")))
int csubgraph_has_node(int32_t sg_handle, void *name_ptr, int name_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return 0;
    std::string name = toStr(name_ptr, name_len);
    return agnode(sg, const_cast<char *>(name.c_str()), 0) ? 1 : 0;
}

__attribute__((export_name("csubgraph_has_edge")))
int csubgraph_has_edge(int32_t sg_handle,
                       void *tail_ptr, int tail_len,
                       void *head_ptr, int head_len,
                       void *key_ptr,  int key_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return 0;
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    Agnode_t *t = agnode(sg, const_cast<char *>(tail.c_str()), 0);
    Agnode_t *h = agnode(sg, const_cast<char *>(head.c_str()), 0);
    if (!t || !h) return 0;
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    return agedge(sg, t, h, k, 0) ? 1 : 0;
}

__attribute__((export_name("csubgraph_node_count")))
int csubgraph_node_count(int32_t sg_handle)
{
    Agraph_t *sg = toGraph(sg_handle);
    return sg ? agnnodes(sg) : 0;
}

__attribute__((export_name("csubgraph_edge_count")))
int csubgraph_edge_count(int32_t sg_handle)
{
    Agraph_t *sg = toGraph(sg_handle);
    return sg ? agnedges(sg) : 0;
}

__attribute__((export_name("csubgraph_get_attr")))
int csubgraph_get_attr(int32_t sg_handle, void *attr_ptr, int attr_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return storeResult("");
    std::string attr = toStr(attr_ptr, attr_len);
    char *val = agget(sg, const_cast<char *>(attr.c_str()));
    return storeResult(val ? val : "");
}

__attribute__((export_name("csubgraph_get_node_attr")))
int csubgraph_get_node_attr(int32_t sg_handle,
                            void *node_ptr, int node_len,
                            void *attr_ptr, int attr_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return storeResult("");
    std::string node = toStr(node_ptr, node_len);
    std::string attr = toStr(attr_ptr, attr_len);
    Agnode_t *n = agnode(sg, const_cast<char *>(node.c_str()), 0);
    if (!n) return storeResult("");
    char *val = agget(n, const_cast<char *>(attr.c_str()));
    return storeResult(val ? val : "");
}

__attribute__((export_name("csubgraph_get_edge_attr")))
int csubgraph_get_edge_attr(int32_t sg_handle,
                            void *tail_ptr, int tail_len,
                            void *head_ptr, int head_len,
                            void *key_ptr,  int key_len,
                            void *attr_ptr, int attr_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return storeResult("");
    std::string tail = toStr(tail_ptr, tail_len);
    std::string head = toStr(head_ptr, head_len);
    std::string key  = toStr(key_ptr,  key_len);
    std::string attr = toStr(attr_ptr, attr_len);
    Agnode_t *t = agnode(sg, const_cast<char *>(tail.c_str()), 0);
    Agnode_t *h = agnode(sg, const_cast<char *>(head.c_str()), 0);
    if (!t || !h) return storeResult("");
    char *k = key.empty() ? nullptr : const_cast<char *>(key.c_str());
    Agedge_t *e = agedge(sg, t, h, k, 0);
    if (!e) return storeResult("");
    char *val = agget(e, const_cast<char *>(attr.c_str()));
    return storeResult(val ? val : "");
}

// ---------------------------------------------------------------------------
// CSubgraph traversal
// ---------------------------------------------------------------------------

__attribute__((export_name("csubgraph_node_names")))
int csubgraph_node_names(int32_t sg_handle)
{
    Agraph_t *sg = toGraph(sg_handle);
    if (!sg) return storeResult("[]");
    std::string result = "[";
    bool first = true;
    for (Agnode_t *n = agfstnode(sg); n; n = agnxtnode(sg, n))
    {
        if (!first) result += ',';
        result += jsonStr(agnameof(n));
        first = false;
    }
    result += ']';
    return storeResult(result);
}

__attribute__((export_name("csubgraph_edges")))
int csubgraph_edges(int32_t sg_handle)
{
    Agraph_t *sg = toGraph(sg_handle);
    return storeResult(sg ? edgeTriples(sg) : "[]");
}

__attribute__((export_name("csubgraph_out_edges")))
int csubgraph_out_edges(int32_t sg_handle, void *node_ptr, int node_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    return storeResult(sg ? outEdgeTriples(sg, toStr(node_ptr, node_len)) : "[]");
}

__attribute__((export_name("csubgraph_in_edges")))
int csubgraph_in_edges(int32_t sg_handle, void *node_ptr, int node_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    return storeResult(sg ? inEdgeTriples(sg, toStr(node_ptr, node_len)) : "[]");
}

__attribute__((export_name("csubgraph_node_edges")))
int csubgraph_node_edges(int32_t sg_handle, void *node_ptr, int node_len)
{
    Agraph_t *sg = toGraph(sg_handle);
    return storeResult(sg ? nodeEdgeTriples(sg, toStr(node_ptr, node_len)) : "[]");
}

} // extern "C" (CGraph/CSubgraph bridge)
