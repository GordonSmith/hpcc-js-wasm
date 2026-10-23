import { LIBRARY_CAPABILITIES, type Capability, type DriverName, type OperationName, type Operations, type Outcome, type UtilDriver } from "./driver.ts";
import { execute } from "./executor.mjs";

export async function createInProcessDriver(name: Extract<DriverName, "node-inprocess" | "browser">): Promise<UtilDriver> {
    const utility = await import("@hpcc-js/wasm-util");
    return {
        name,
        capabilities: new Set<Capability>(LIBRARY_CAPABILITIES),
        execute<K extends OperationName>(op: K, args: Operations[K]["args"]): Promise<Outcome<Operations[K]["result"]>> {
            return execute(utility, op, args);
        },
        async dispose() { }
    };
}
