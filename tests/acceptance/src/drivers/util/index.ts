import { LIBRARY_CAPABILITIES, type DriverDescriptor, type DriverName } from "./driver.ts";

export * from "./driver.ts";

export const UTIL_DRIVERS: readonly DriverDescriptor[] = [
    {
        name: "node-inprocess",
        environment: "node",
        capabilities: LIBRARY_CAPABILITIES,
        create: async () => (await import("./inprocess.ts")).createInProcessDriver("node-inprocess")
    },
    {
        name: "node-no-globals",
        environment: "node",
        capabilities: [...LIBRARY_CAPABILITIES, "noOptionalGlobals"],
        create: async () => (await import("./no-globals.ts")).createNoGlobalsDriver()
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

export function availableDrivers(): DriverDescriptor[] {
    const env = currentEnvironment();
    const filter = env === "node" ? process.env.ACCEPTANCE_DRIVERS : undefined;
    const wanted = filter ? new Set(filter.split(",").map(s => s.trim()).filter(Boolean) as DriverName[]) : undefined;
    return UTIL_DRIVERS.filter(driver => driver.environment === env && (!wanted || wanted.has(driver.name)));
}
