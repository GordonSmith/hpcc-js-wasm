#include "main.hpp"

#include <gvc.h>
#include <gvplugin.h>
#include <graphviz_version.h>

#include "root.h"

extern gvplugin_library_t gvplugin_dot_layout_LTX_library;
extern gvplugin_library_t gvplugin_neato_layout_LTX_library;
#ifdef HAVE_LIBGD
extern gvplugin_library_t gvplugin_gd_LTX_library;
#endif
#ifdef HAVE_PANGOCAIRO
extern gvplugin_library_t gvplugin_pango_LTX_library;
#ifdef HAVE_WEBP
extern gvplugin_library_t gvplugin_webp_LTX_library;
#endif
#endif
extern gvplugin_library_t gvplugin_core_LTX_library;

lt_symlist_t lt_preloaded_symbols[] = {
    {"gvplugin_dot_layout_LTX_library", &gvplugin_dot_layout_LTX_library},
    {"gvplugin_neato_layout_LTX_library", &gvplugin_neato_layout_LTX_library},
#ifdef HAVE_PANGOCAIRO
    {"gvplugin_pango_LTX_library", &gvplugin_pango_LTX_library},
#ifdef HAVE_WEBP
    {"gvplugin_webp_LTX_library", &gvplugin_webp_LTX_library},
#endif
#endif
#ifdef HAVE_LIBGD
    {"gvplugin_gd_LTX_library", &gvplugin_gd_LTX_library},
#endif
    {"gvplugin_core_LTX_library", &gvplugin_core_LTX_library},
    {0, 0}};

StringBuffer lastErrorStr;

int vizErrorf(char *buf)
{
    lastErrorStr = buf;
    return 0;
}

extern int Y_invert;
int origYInvert = Y_invert;
extern int Nop;
int origNop = Nop;

const char *Graphviz::version()
{
    return PACKAGE_VERSION;
}

const char *Graphviz::lastError()
{
    return lastErrorStr;
}

Graphviz::Graphviz(int yInvert, int nop)
{
    configure(yInvert, nop);
}

void Graphviz::configure(int yInvert, int nop)
{
    Y_invert = yInvert > 0 ? yInvert : origYInvert;
    Nop = nop > 0 ? nop : origNop;

    lastErrorStr = "";
    agseterr(AGERR);
    agseterrf(vizErrorf);
    // agreadline(1);
}

Graphviz::~Graphviz()
{
}

void Graphviz::createFile(const char *path, const char *data)
{
    // TODO: Implement WASI file system support
    // For now, this is disabled when building as a WASI component
    (void)path;
    (void)data;

    // EM_ASM(
    //     {
    //         var path = UTF8ToString($0);
    //         var data = UTF8ToString($1);

    //         FS.createPath("/", PATH.dirname(path));
    //         FS.writeFile(PATH.join("/", path), data);
    //     },
    //     path, data);
}

const char *Graphviz::layout(const char *src, const char *format, const char *engine)
{
    layout_result = "";

    GVC_t *gvc = gvContextPlugins(lt_preloaded_symbols, true);

    Agraph_t *graph = agmemread(src);
    if (graph)
    {
        char *data = NULL;
        size_t length;

        gvLayout(gvc, graph, engine);
        gvRenderData(gvc, graph, format, &data, &length);
        layout_result = data;
        gvFreeRenderData(data);
        gvFreeLayout(gvc, graph);
        agclose(graph);
    }

    gvFinalize(gvc);
    gvFreeContext(gvc);

    return layout_result;
}

bool Graphviz::acyclic(const char *src, bool doWrite, bool verbose)
{
    acyclic_outFile = "";
    acyclic_num_rev = 0;
    bool retVal = false;

    Agraph_t *graph = agmemread(src);
    if (graph)
    {
        TempFileBuffer outFile;
        graphviz_acyclic_options_t opts = {outFile, doWrite, verbose};
        retVal = graphviz_acyclic(graph, &opts, &acyclic_num_rev);
        acyclic_outFile = outFile;
        agclose(graph);
    }
    return retVal;
}

void Graphviz::tred(const char *src, bool verbose, bool printRemovedEdges)
{
    tred_out = "";
    tred_err = "";

    Agraph_t *graph = agmemread(src);
    if (graph)
    {
        TempFileBuffer out;
        TempFileBuffer err;
        graphviz_tred_options_t opts = {verbose, printRemovedEdges, out, err};
        graphviz_tred(graph, &opts);
        tred_out = out;
        tred_err = err;
        agclose(graph);
    }
}

const char *Graphviz::unflatten(const char *src, int maxMinlen, bool do_fans, int chainLimit)
{
    unflatten_out = "";

    Agraph_t *graph = agmemread(src);
    if (graph)
    {
        graphviz_unflatten_options_t opts = {do_fans, maxMinlen, chainLimit};
        graphviz_unflatten(graph, &opts);

        TempFileBuffer tempFile;
        agwrite(graph, tempFile);
        unflatten_out = tempFile;
        agclose(graph);
    }
    return unflatten_out;
}

namespace
{
    std::string to_std_string(const root_string_t *value)
    {
        if (!value || value->ptr == nullptr || value->len == 0)
        {
            return std::string();
        }
        return std::string(reinterpret_cast<const char *>(value->ptr), value->len);
    }
}

extern "C"
{
    exports_hpcc_js_graphviz_resources_own_graphviz_t exports_hpcc_js_graphviz_resources_constructor_graphviz(void)
    {
        auto *instance = new Graphviz();
        return exports_hpcc_js_graphviz_resources_graphviz_new(reinterpret_cast<exports_hpcc_js_graphviz_resources_graphviz_t *>(instance));
    }

    void exports_hpcc_js_graphviz_resources_graphviz_destructor(exports_hpcc_js_graphviz_resources_graphviz_t *rep)
    {
        auto *instance = reinterpret_cast<Graphviz *>(rep);
        delete instance;
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_init(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, int32_t y_invert, int32_t nop)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        instance->configure(y_invert, nop);
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_version(exports_hpcc_js_graphviz_resources_borrow_graphviz_t /*self*/, root_string_t *ret)
    {
        root_string_dup(ret, Graphviz::version());
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_last_error(exports_hpcc_js_graphviz_resources_borrow_graphviz_t /*self*/, root_string_t *ret)
    {
        root_string_dup(ret, Graphviz::lastError());
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_create_file(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *file, root_string_t *data)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        const auto fileStr = to_std_string(file);
        const auto dataStr = to_std_string(data);
        instance->createFile(fileStr.c_str(), dataStr.c_str());
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_layout_result(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *ret)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        root_string_dup(ret, instance->layout_result);
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_layout(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *dot, root_string_t *format, root_string_t *engine, root_string_t *ret)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        const auto dotStr = to_std_string(dot);
        const auto formatStr = to_std_string(format);
        const auto engineStr = to_std_string(engine);
        const char *result = instance->layout(dotStr.c_str(), formatStr.c_str(), engineStr.c_str());
        root_string_dup(ret, result);
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_acyclic_out_file(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *ret)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        root_string_dup(ret, instance->acyclic_outFile);
    }

    int32_t exports_hpcc_js_graphviz_resources_method_graphviz_acyclic_num_rev(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        return static_cast<int32_t>(instance->acyclic_num_rev);
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_set_acyclic_num_rev(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, int32_t value)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        instance->acyclic_num_rev = static_cast<size_t>(value);
    }

    bool exports_hpcc_js_graphviz_resources_method_graphviz_acyclic(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *dot, bool do_write, bool verbose)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        const auto dotStr = to_std_string(dot);
        return instance->acyclic(dotStr.c_str(), do_write, verbose);
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_tred_out(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *ret)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        root_string_dup(ret, instance->tred_out);
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_tred_err(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *ret)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        root_string_dup(ret, instance->tred_err);
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_tred(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *dot, bool verbose, bool print_removed_edges)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        const auto dotStr = to_std_string(dot);
        instance->tred(dotStr.c_str(), verbose, print_removed_edges);
    }

    void exports_hpcc_js_graphviz_resources_method_graphviz_unflatten(exports_hpcc_js_graphviz_resources_borrow_graphviz_t self, root_string_t *dot, int32_t max_minlen, bool do_fans, int32_t chain_limit, root_string_t *ret)
    {
        auto *instance = reinterpret_cast<Graphviz *>(self);
        const auto dotStr = to_std_string(dot);
        const char *result = instance->unflatten(dotStr.c_str(), max_minlen, do_fans, chain_limit);
        root_string_dup(ret, result);
    }
}
