#include "duckdb.hpp"

using namespace duckdb;

int xxx()
{
    DuckDB db(nullptr);

    Connection con(db);

    con.Query("CREATE TABLE integers(i INTEGER)");
    con.Query("INSERT INTO integers VALUES (3)");
    auto result = con.Query("SELECT * FROM integers");
    result->Print();
    return 0;
}

#include <string>

const char *const version = "0.0.1";

class CDuckDB
{
protected:
    // basE91 m_basE91;

public:
    CDuckDB()
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
        xxx();
        return ::version;
    }
};

//  Include JS Glue  ---
#include "main_glue.cpp"
