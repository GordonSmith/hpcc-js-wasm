import { forEachUtilDriver } from "../src/dsl/scenario-util.ts";

forEachUtilDriver("WASM utility helpers", scenarios => {
    scenarios.scenario("UTIL-HEAP-001", "heap helpers preserve byte allocation and view behavior", ["heap"], async util => {
        await util.heapBehavior();
    });

    scenarios.scenario("UTIL-STRING-001", "string helpers use UTF-8 byte lengths", ["strings"], async util => {
        await util.stringBehavior("a😀", 5);
    });

    scenarios.scenario("UTIL-FS-001", "filesystem helpers detect and forward filesystem operations", ["filesystem"], async util => {
        await util.filesystemBehavior();
    });

    scenarios.scenario("UTIL-IMPORT-001", "the public entry loads without optional browser globals", ["noOptionalGlobals"], async util => {
        await util.publicExportsLoadWithoutOptionalGlobals();
    });
});
