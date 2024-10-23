# @hpcc-js/wasm-duckdb

This package rewraps the DuckDB webassembly distribution provided by DuckDB, this is purly a convenience to provide a consistent loading experience with the rest of the @hpcc-js.wasm library.
See [DuckDB](https://github.com/duckdb/duckdb) and [DuckDB-wasm](https://github.com/duckdb/duckdb-wasm) for more details.

## Installation

```sh
npm install @hpcc-js/wasm-duckdb
```

## Usage

```typescript
import { DuckDB } from "@hpcc-js/wasm-duckdb";

let duckdb = await DuckDB.load();
const c = await duckdb.db.connect();

const data = [
    { "col1": 1, "col2": "foo" },
    { "col1": 2, "col2": "bar" },
];
await duckdb.db.registerFileText("rows.json", JSON.stringify(data));
await c.insertJSONFromPath('rows.json', { name: 'rows' });

const arrowResult = await c.query("SELECT * FROM read_json_auto('rows.json')");
const result = arrowResult.toArray().map((row) => row.toJSON());
expect(result.length).to.equal(data.length);
for (let i = 0; i < result.length; i++) {
    expect(result[i].col2).to.equal(data[i].col2);
}

c.close();
```

## Reference

* [API Documentation](https://hpcc-systems.github.io/hpcc-js-wasm/duckdb/src/duckdb/classes/DuckDB.html)
