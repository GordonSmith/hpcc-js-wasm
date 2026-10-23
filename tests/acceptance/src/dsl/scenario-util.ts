import { afterAll, beforeAll, describe, it } from "vitest";
import { availableDrivers, type Capability, type DriverDescriptor, type UtilDriver } from "../drivers/util/index.ts";
import { UtilDsl } from "./util.ts";

export type UtilSpecId = `${string}-${string}-${number}`;

export interface UtilScenarios {
    scenario(specId: UtilSpecId, title: string, requires: Capability[], body: (util: UtilDsl) => Promise<void>): void;
}

function scenariosFor(descriptor: DriverDescriptor, driver: () => UtilDriver): UtilScenarios {
    return {
        scenario(specId, title, requires, body) {
            const missing = requires.filter(capability => !descriptor.capabilities.includes(capability));
            const name = missing.length ? `${specId}: ${title} (n/a: no ${missing.join(", ")})` : `${specId}: ${title}`;
            it.skipIf(missing.length > 0)(name, async () => {
                await body(new UtilDsl(driver()));
            });
        }
    };
}

export function forEachUtilDriver(suite: string, define: (scenarios: UtilScenarios) => void): void {
    describe(suite, () => {
        const drivers = availableDrivers();
        if (drivers.length === 0) {
            it.skip("no util driver available in this environment");
            return;
        }
        for (const descriptor of drivers) {
            describe(`[${descriptor.name}]`, () => {
                let driver: UtilDriver | undefined;
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
