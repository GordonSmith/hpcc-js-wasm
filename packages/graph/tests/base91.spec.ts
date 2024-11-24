import { describe, it, expect } from "vitest";
import { Graph } from "@hpcc-js/wasm-graph";

describe("graph", function () {

    it("version", async function () {
        let graph = await Graph.load();
        expect(await Graph.load()).to.equal(graph);
        let v = graph.version();
        expect(v).to.be.a.string;
        expect(v).to.equal("0.6.0");
        console.log("graph version: " + v);
        Graph.unload();

        graph = await Graph.load();
        expect(await Graph.load()).to.equal(graph);
        v = graph.version();
        expect(v).to.be.a.string;
        expect(v).to.not.be.empty;
        Graph.unload();
    });

    it("simple", async function () {
        const graph = await Graph.load();

        const data = new Uint8Array(Array.from({ length: 1000 }, (_, i) => i % 256));
        const base91Str = graph.encode(data);
        const data2 = await graph.decode(base91Str);
        expect(data).to.deep.equal(data2);
    });
});
