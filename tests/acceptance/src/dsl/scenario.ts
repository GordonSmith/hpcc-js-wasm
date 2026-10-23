import { afterAll, beforeAll, describe, it } from "vitest";
import { availableDrivers, type Capability, type DriverDescriptor, type GraphvizDriver } from "../drivers/graphviz/index.ts";
import { GraphvizDsl } from "./graphviz.ts";

/** A spec identifier such as `GV-RENDER-001`; must exist in specs/**.md (see scripts/check-spec-coverage.mjs). */
export type SpecId = `${string}-${string}-${number}`;

export interface GraphvizScenarios {
    /**
     * Declare a test case proving `specId`. It runs once per available driver that has
     * every capability in `requires`, and is reported as skipped for the others.
     */
    scenario(specId: SpecId, title: string, requires: Capability[], body: (gv: GraphvizDsl) => Promise<void>): void;
}

function scenariosFor(descriptor: DriverDescriptor, driver: () => GraphvizDriver): GraphvizScenarios {
    return {
        scenario(specId, title, requires, body) {
            const missing = requires.filter(c => !descriptor.capabilities.includes(c));
            const name = missing.length ? `${specId}: ${title} (n/a: no ${missing.join(", ")})` : `${specId}: ${title}`;
            it.skipIf(missing.length > 0)(name, async () => {
                await body(new GraphvizDsl(driver()));
            });
        }
    };
}

/** Run the same set of scenarios against every graphviz driver available in this environment. */
export function forEachGraphvizDriver(suite: string, define: (s: GraphvizScenarios) => void): void {
    describe(suite, () => {
        const drivers = availableDrivers();
        if (drivers.length === 0) {
            it.skip("no graphviz driver available in this environment");
            return;
        }
        for (const descriptor of drivers) {
            describe(`[${descriptor.name}]`, () => {
                let driver: GraphvizDriver | undefined;
                beforeAll(async () => {
                    driver = await descriptor.create();
                });
                afterAll(async () => {
                    await driver?.dispose();
                });
                define(scenariosFor(descriptor, () => driver!));
            });
        }
    });
}
