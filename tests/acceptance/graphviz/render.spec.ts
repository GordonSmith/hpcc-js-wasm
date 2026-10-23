import { expect } from "vitest";
import { forEachGraphvizDriver } from "../src/dsl/scenario.ts";
import { ENGINES, FORMATS, graphs } from "../src/dsl/graphviz.ts";

// specs/graphviz/render.md

forEachGraphvizDriver("graphviz rendering", ({ scenario }) => {

    scenario("GV-RENDER-001", "default render is SVG laid out by dot", ["layout"], async gv => {
        (await gv.render(graphs.twoNodes))
            .shouldBeSvg()
            .shouldContainNodes("a", "b");
    });

    scenario("GV-RENDER-002", "every layout engine renders a graph", ["layout"], async gv => {
        for (const engine of ENGINES) {
            (await gv.render(graphs.twoNodes, { engine }))
                .shouldBeSvg()
                .shouldContainNodes("a", "b");
        }
    });

    scenario("GV-RENDER-003", "every supported output format has the right shape", ["layout"], async gv => {
        for (const format of FORMATS) {
            (await gv.render(graphs.twoNodes, { format })).shouldBeA(format);
        }
    });

    scenario("GV-RENDER-004", "invalid DOT is reported as a syntax error", ["layout"], async gv => {
        (await gv.render(graphs.invalid)).shouldFailWith(/syntax error in line 1/);
    });

    scenario("GV-RENDER-005", "empty DOT renders to an empty result", ["layout", "emptyInput"], async gv => {
        (await gv.render(graphs.empty)).shouldBeEmpty();
    });

    scenario("GV-RENDER-006", "recovers after an error", ["layout"], async gv => {
        (await gv.render(graphs.invalid)).shouldFailWith("syntax error");
        (await gv.render(graphs.twoNodes)).shouldBeSvg().shouldContainNodes("a", "b");
    });

    scenario("GV-RENDER-007", "yInvert flips the Y axis in plain output", ["layout", "yInvert"], async gv => {
        const normal = await gv.render(graphs.twoNodes, { format: "plain" });
        const inverted = await gv.render(graphs.twoNodes, { format: "plain", yInvert: true });
        expect(normal.positionOf("a").y).toBeGreaterThan(normal.positionOf("b").y);
        expect(inverted.positionOf("a").y).toBeLessThan(inverted.positionOf("b").y);
    });

    scenario("GV-RENDER-008", "images can be supplied with explicit dimensions", ["layout", "images"], async gv => {
        (await gv.render(graphs.withImage("logo.png"), { images: [{ path: "logo.png", width: "272px", height: "92px" }] }))
            .shouldBeSvg()
            .shouldContainImage("logo.png", { width: "204px", height: "69px" });
    });

    scenario("GV-RENDER-009", "nop keeps the positions given in the input", ["layout", "nop"], async gv => {
        const result = await gv.render(graphs.pinned, { engine: "neato", format: "plain", nop: 1 });
        const a = result.positionOf("a");
        const b = result.positionOf("b");
        expect(b.x).toBeGreaterThan(a.x);
        expect(b.y).toBeGreaterThan(a.y);
    });
});
