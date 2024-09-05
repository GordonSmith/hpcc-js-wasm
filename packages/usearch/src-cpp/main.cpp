#include <usearch/index.hpp>
#include <usearch/index_dense.hpp>
#include <string>

#include <emscripten/emscripten.h>
#include <emscripten/bind.h>

#define USEARCH_VERSION_MAJOR 2
#define USEARCH_VERSION_MINOR 15
#define USEARCH_VERSION_PATCH 1

std::string version()
{
    return std::to_string(USEARCH_VERSION_MAJOR) + "." + std::to_string(USEARCH_VERSION_MINOR) + "." + std::to_string(USEARCH_VERSION_PATCH);
}

using namespace unum::usearch;

struct Matches
{
    std::vector<default_key_t> keys;
    std::vector<float> distances;
    size_t count;
};

class CUSearch
{
protected:
    index_dense_t *index;
    std::string error;

public:
    CUSearch(std::size_t dimensions, metric_kind_t metric_kind, scalar_kind_t quantization,
             std::size_t connectivity, std::size_t expansion_add, std::size_t expansion_search, bool multi)
    {
        metric_punned_t metric(dimensions, metric_kind, quantization);
        if (metric.missing())
        {
            error = "Failed to initialize the metric!";
            return;
        }

        index_dense_config_t config(connectivity, expansion_add, expansion_search);
        config.multi = multi;
        index = new index_dense_t(index_dense_t::make(metric, config));
        if (!index)
            error = "Out of memory!";
    }

    ~CUSearch()
    {
        delete index;
    }

    static void *malloc(size_t __size)
    {
        return ::malloc(__size);
    }

    static void free(void *__ptr)
    {
        ::free(__ptr);
    }

    const std::string &lastError()
    {
        return error;
    }

    size_t dimensions()
    {
        return index->dimensions();
    }

    size_t size()
    {
        return index->size();
    }

    size_t capacity()
    {
        return index->capacity();
    }

    size_t connectivity()
    {
        return index->connectivity();
    }

    bool save(const std::string &path)
    {
        serialization_result_t result = index->save(path.c_str());
        if (!result)
            error = result.error.release();
        return !!result;
    }

    bool load(const std::string &path)
    {
        serialization_result_t result = index->load(path.c_str());
        if (!result)
            error = result.error.release();
        return !!result;
    }

    bool view(const std::string &path)
    {
        serialization_result_t result = index->view(path.c_str());
        if (!result)
            error = result.error.release();
        return !!result;
    }

    bool add(default_key_t key, const std::vector<f32_t> &vector)
    {
        try
        {
            auto add_result = index->add(key, vector.data());
            if (!add_result)
                error = add_result.error.release();
            return !!add_result;
        }
        catch (std::exception &e)
        {
            error = e.what();
            return false;
        }
    }

    Matches search(const std::vector<f32_t> &vector, size_t k)
    {
        index_dense_t::search_result_t search_result = index->search(vector.data(), k);
        if (!search_result)
            error = search_result.error.release();

        Matches retVal;
        for (std::size_t i = 0; i != search_result.size(); ++i)
        {
            retVal.keys.push_back(search_result[i].member.key);
            retVal.distances.push_back(search_result[i].distance);
        }
        retVal.count = search_result.count;
        return retVal;
    }

    bool contains(default_key_t key)
    {
        return index->contains(key);
    }

    bool remove(default_key_t key)
    {
        auto remove_result = index->remove(key);
        if (!remove_result)
            error = remove_result.error.release();
        return !!remove_result;
    }
};

//  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---  EMSCRIPTEN BINDINGS  ---
using namespace emscripten;

EMSCRIPTEN_BINDINGS(usearch_class)
{
    function("version", &version);

    enum_<metric_kind_t>("MetricKind")
        .value("unknown", metric_kind_t::unknown_k)
        .value("ip", metric_kind_t::ip_k)
        .value("cos", metric_kind_t::cos_k)
        .value("l2sq", metric_kind_t::l2sq_k)
        .value("pearson", metric_kind_t::pearson_k)
        .value("haversine", metric_kind_t::haversine_k)
        .value("divergence", metric_kind_t::divergence_k)
        .value("hamming", metric_kind_t::hamming_k)
        .value("tanimoto", metric_kind_t::tanimoto_k)
        .value("sorensen", metric_kind_t::sorensen_k)
        .value("jaccard", metric_kind_t::jaccard_k);

    enum_<scalar_kind_t>("ScalarKind")
        .value("unknown", scalar_kind_t::unknown_k)
        .value("b1x8", scalar_kind_t::b1x8_k)
        .value("u40", scalar_kind_t::u40_k)
        .value("uuid", scalar_kind_t::uuid_k)
        .value("bf16", scalar_kind_t::bf16_k)
        .value("f64", scalar_kind_t::f64_k)
        .value("f32", scalar_kind_t::f32_k)
        .value("f16", scalar_kind_t::f16_k)
        .value("f8", scalar_kind_t::f8_k)
        .value("u64", scalar_kind_t::u64_k)
        .value("u32", scalar_kind_t::u32_k)
        .value("u16", scalar_kind_t::u16_k)
        .value("u8", scalar_kind_t::u8_k)
        .value("i64", scalar_kind_t::i64_k)
        .value("i32", scalar_kind_t::i32_k)
        .value("i16", scalar_kind_t::i16_k)
        .value("i8", scalar_kind_t::i8_k);

    register_vector<default_key_t>("VectorKey");
    register_vector<f32_t>("VectorF32");

    class_<Matches>("Matches")
        .property("keys", &Matches::keys)
        .property("distances", &Matches::distances)
        .property("count", &Matches::count);

    class_<CUSearch>("CUSearch")
        .constructor<std::size_t, metric_kind_t, scalar_kind_t, std::size_t, std::size_t, std::size_t, bool>()
        .function("lastError", &CUSearch::lastError)
        .function("dimensions", &CUSearch::dimensions)
        .function("size", &CUSearch::size)
        .function("capacity", &CUSearch::capacity)
        .function("connectivity", &CUSearch::connectivity)
        .function("save", &CUSearch::save)
        .function("load", &CUSearch::load)
        .function("view", &CUSearch::view)
        .function("add", &CUSearch::add)
        .function("search", &CUSearch::search)
        .function("contains", &CUSearch::contains)
        .function("remove", &CUSearch::remove);
}

//  Include JS Glue  ---
// #include "main_glue.cpp"
