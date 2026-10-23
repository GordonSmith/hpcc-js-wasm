import { describe, expect, it } from "vitest";
import { Graphviz } from "@hpcc-js/wasm-graphviz";

describe("Graphviz lifecycle", () => {
    it("nested using scopes keep the outer Graphviz instance usable", async () => {
        Graphviz.dispose();

        try {
            using outer = await Graphviz.load();
            {
                using inner = await Graphviz.load();
                expect(inner).toBe(outer);
                expect(inner.layout("digraph G { inner -> scope }", "svg")).toContain("<svg");
            }

            expect(outer.version()).toBeDefined();
            expect(outer.layout("digraph G { outer -> scope }", "svg")).toContain("<svg");
        } finally {
            Graphviz.dispose();
        }
    });
});
