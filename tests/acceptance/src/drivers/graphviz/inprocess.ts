import { LIBRARY_CAPABILITIES, type Capability, type DriverName, type GraphvizDriver, type OperationName, type Operations, type Outcome } from "./driver.ts";
import { execute } from "./executor.mjs";

/**
 * Talks to the package by importing its published entry point in the current JS context.
 * Used both for Node ("node-inprocess") and for the browser page ("browser").
 */
export async function createInProcessDriver(name: Extract<DriverName, "node-inprocess" | "browser">): Promise<GraphvizDriver> {
    const { Graphviz } = await import("@hpcc-js/wasm-graphviz");
    return {
        name,
        capabilities: new Set<Capability>(LIBRARY_CAPABILITIES),
        execute<K extends OperationName>(op: K, args: Operations[K]["args"]): Promise<Outcome<Operations[K]["result"]>> {
            return execute(Graphviz, op, args);
        },
        async dispose() {
            Graphviz.unload();
        }
    };
}
