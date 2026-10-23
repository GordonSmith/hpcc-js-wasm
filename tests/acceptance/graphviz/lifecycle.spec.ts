import { expect } from "vitest";
import { forEachGraphvizDriver } from "../src/dsl/scenario.ts";
import { graphs } from "../src/dsl/graphviz.ts";

// specs/graphviz/lifecycle.md

forEachGraphvizDriver("graphviz lifecycle", ({ scenario }) => {

    scenario("GV-LOAD-001", "reports the bundled Graphviz version", ["version"], async gv => {
        expect(await gv.version()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    scenario("GV-LOAD-002", "loading is memoised", ["lifecycle"], async gv => {
        (await gv.loadTwice())
            .shouldReturnSameInstance()
            .shouldStillRender();
    });

    scenario("GV-LOAD-003", "static dispose is idempotent and the library can be reloaded", ["lifecycle"], async gv => {
        (await gv.unloadTwiceThenLoad())
            .shouldObserve("secondDisposeSilent")
            .shouldObserve("legacyUnloadSilent")
            .shouldReturnNewInstance()
            .shouldObserve("stableAfterReload")
            .shouldStillRender();
    });

    scenario("GV-LOAD-004", "disposing an instance unloads it", ["lifecycle"], async gv => {
        (await gv.disposeThenLoad())
            .shouldObserve("supportsUsing")
            .shouldReturnNewInstance()
            .shouldObserve("staleDisposeIsNoop")
            .shouldStillRender();
    });

    scenario("GV-LOAD-005", "disposing one loaded scope does not invalidate another", ["lifecycle"], async gv => {
        (await gv.overlappingUsingScopes())
            .shouldObserve("supportsUsing")
            .shouldObserve("remainingScopeUsable")
            .shouldObserve("reloadAfterScopesUsable");
    });

    scenario("GV-RESOURCE-001", "every resource handle supports explicit and scoped disposal", ["lifecycle"], async gv => {
        (await gv.disposeEveryResource())
            .shouldExposeDisposeForEveryResource()
            .shouldDisposeExplicitlyForEveryResource()
            .shouldSupportUsingForEveryResource();
    });

    scenario("GV-ENV-001", "renders a graph in this environment", ["layout"], async gv => {
        (await gv.render(graphs.twoNodes))
            .shouldBeSvg()
            .shouldContainNodes("a", "b");
    });
});
