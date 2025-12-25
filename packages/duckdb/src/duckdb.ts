// @ts-expect-error importing from a wasm file is resolved via a custom esbuild plugin
import load, { reset } from "../../../build/packages/duckdb/duckdblib.wasm";
import type { MainModule, DuckDB as CPPDuckDB } from "../../../build/packages/duckdb/duckdblib.js";
import { MainModuleEx } from "@hpcc-js/wasm-util";

let g_duckdb: Promise<DuckDB>;
const textEncoder = new TextEncoder();

/**
 * DuckDB WASM library, a in-process SQL OLAP Database Management System..
 * 
 * See [DuckDB](https://github.com/duckdb/duckdb) for more details.
 *
 * ```ts
 * import { DuckDB } from "@hpcc-js/wasm-duckdb";
 * 
 * let duckdb = await DuckDB.load();
 * const c = await duckdb.connect();
 * 
 * const data = [
 *     { "col1": 1, "col2": "foo" },
 *     { "col1": 2, "col2": "bar" },
 * ];
 * await duckdb.registerFileText("rows.json", JSON.stringify(data));
 * await c.insertJSONFromPath('rows.json', { name: 'rows' });
 * 
 * const arrowResult = await c.query("SELECT * FROM read_json_auto('rows.json')");
 * const result = arrowResult.toArray().map((row) => row.toJSON());
 * expect(result.length).to.equal(data.length);
 * for (let i = 0; i < result.length; i++) {
 *     expect(result[i].col2).to.equal(data[i].col2);
 * }
 * 
 * c.close();
 * ```
 */



export class DuckDB extends MainModuleEx<MainModule> {

    db: CPPDuckDB

    private constructor(_module: MainModule) {
        super(_module);
        this.db = this._module.create()!;
        const { FS_createPath } = this._module;
        FS_createPath("/", "home/web_user", true, true);
    }

    /**
     * Compiles and instantiates the raw wasm.
     * 
     * ::: info
     * In general WebAssembly compilation is disallowed on the main thread if the buffer size is larger than 4KB, hence forcing `load` to be asynchronous;
     * :::
     * 
     * @returns A promise to an instance of the DuckDB class.
     */
    static load(): Promise<DuckDB> {
        if (!g_duckdb) {
            g_duckdb = load().then((module: any) => {
                return new DuckDB(module)
            });
        }
        return g_duckdb;
    }

    /**
     * Unloades the compiled wasm instance.
     */
    static unload() {
        reset();
    }

    /**
     * @returns The DuckDB version
     */
    version(): string {
        return this._module.libraryVersion();
    }

    connect() {
        return this.db.connect()!;
    }

    numberOfThreads(): number {
        return Number(this.db.numberOfThreads());
    }

    registerFile(path: string, content: Uint8Array): void {
        const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
        const split = normalizedPath.lastIndexOf("/");
        const dir = split > 0 ? normalizedPath.substring(0, split) : "/";
        if (dir.length > 1 && this._module.FS_createPath) {
            this._module.FS_createPath(dir, true, true);
        }
        this._module.FS_createDataFile(normalizedPath, undefined, content, true, true, true);
    }

    registerFileString(fileName: string, content: string): void {
        const encoded = textEncoder.encode(content);
        this.registerFile(fileName, encoded);
    }

}
