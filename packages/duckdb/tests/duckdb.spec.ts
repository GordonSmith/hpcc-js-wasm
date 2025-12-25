import { beforeAll, describe, expect, it } from "vitest";
import { DuckDB } from "@hpcc-js/wasm-duckdb";

describe("duckdb", () => {
    let duckdb: DuckDB;

    beforeAll(async () => {
        duckdb = await DuckDB.load();
    });

    it("loads once and reports version", async () => {
        const secondLoad = await DuckDB.load();
        expect(secondLoad).toBe(duckdb);

        const v = duckdb.version();
        expect(typeof v).toBe("string");
        expect(v.length).toBeGreaterThan(0);
        expect(v).toMatch(/^v?\d/);

        expect(duckdb.numberOfThreads()).toBeGreaterThan(0);
    });

    it("runs a simple query", () => {
        const con = duckdb.connect();
        const result = con.query("SELECT 3 + 4 AS value")!;

        expect(Number(result.rowCount())).toBe(1);
        expect(result.getValue(0, 0)).toBe(7);

        result.delete();
        con.delete();
    });

    it("executes prepared statements with parameters", () => {
        const con = duckdb.connect()!;
        con.query("CREATE TABLE person (name VARCHAR, age BIGINT);")!.delete();
        con.query("INSERT INTO person VALUES ('Alice', 37), ('Ana', 35), ('Bob', 41), ('Bea', 25);")!.delete();

        const stmt = con.prepare("SELECT name, age FROM person WHERE starts_with(name, CAST(? AS VARCHAR)) ORDER BY age DESC")!;
        const result = stmt.execute(["B"])!;

        expect(Number(result.rowCount())).toBe(2);
        expect(result.getValue(0, 0)).toBe("Bob");
        expect(result.getValue(1, 0)).toBe(41);
        expect(result.getValue(0, 1)).toBe("Bea");
        expect(result.getValue(1, 1)).toBe(25);

        result.delete();
        stmt.delete();
        con.delete();
    });

    it("supports binding different value types", () => {
        const con = duckdb.connect();
        const stmt = con.prepare("SELECT CAST(? AS VARCHAR) AS s, CAST(? AS BIGINT) AS n, CAST(? AS BOOLEAN) AS b, CAST(? AS VARCHAR) AS z");
        const result = stmt.execute(["x", 42, true, null]);

        expect(result.getValue(0, 0)).toBe("x");
        expect(result.getValue(1, 0)).toBe(42);
        expect(result.getValue(2, 0)).toBe(true);
        expect(result.getValue(3, 0)).toBeNull();

        result.delete();
        stmt.delete();
        con.delete();
    });

    it("can query data from a registered file", () => {
        const con = duckdb.connect();
        const data = [
            { col1: 1, col2: "foo" },
            { col1: 2, col2: "bar" },
        ];

        duckdb.registerFileString("rows.json", JSON.stringify(data));

        const result = con.query("SELECT col1, col2 FROM read_json_auto('rows.json') ORDER BY col1");

        expect(Number(result.rowCount())).toBe(2);
        expect(result.getValue(0, 0)).toBe(1);
        expect(result.getValue(1, 0)).toBe("foo");
        expect(result.getValue(0, 1)).toBe(2);
        expect(result.getValue(1, 1)).toBe("bar");

        result.delete();
        con.delete();
    });
});
