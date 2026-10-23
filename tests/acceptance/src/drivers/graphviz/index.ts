import { LIBRARY_CAPABILITIES, type DriverDescriptor, type DriverName } from "./driver.ts";

export * from "./driver.ts";

/**
 * Every way we can reach the graphviz system under test.
 * Driver modules are imported lazily so node-only code is never loaded in the browser.
 */
export const GRAPHVIZ_DRIVERS: readonly DriverDescriptor[] = [
    {
        name: "node-inprocess",
        environment: "node",
        capabilities: LIBRARY_CAPABILITIES,
        create: async () => (await import("./inprocess.ts")).createInProcessDriver("node-inprocess")
    },
    {
        name: "node-no-globals",
        environment: "node",
        capabilities: LIBRARY_CAPABILITIES,
        create: async () => (await import("./no-globals.ts")).createNoGlobalsDriver()
    },
    {
        name: "cli",
        environment: "node",
        capabilities: ["layout", "version", "yInvert", "nop"],
        create: async () => (await import("./cli.ts")).createCliDriver()
    },
    {
        name: "browser",
        environment: "browser",
        capabilities: LIBRARY_CAPABILITIES,
        create: async () => (await import("./inprocess.ts")).createInProcessDriver("browser")
    }
];

export function currentEnvironment(): "node" | "browser" {
    return typeof window !== "undefined" && typeof document !== "undefined" ? "browser" : "node";
}

/** Drivers usable in this environment, optionally filtered by `ACCEPTANCE_DRIVERS=a,b`. */
export function availableDrivers(): DriverDescriptor[] {
    const env = currentEnvironment();
    const filter = env === "node" ? process.env.ACCEPTANCE_DRIVERS : undefined;
    const wanted = filter ? new Set(filter.split(",").map(s => s.trim()).filter(Boolean) as DriverName[]) : undefined;
    return GRAPHVIZ_DRIVERS.filter(d => d.environment === env && (!wanted || wanted.has(d.name)));
}
