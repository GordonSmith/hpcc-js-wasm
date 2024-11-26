import { writeFileSync } from "fs";
import { describe, it, expect } from "vitest";
import { Graphviz } from "@hpcc-js/wasm-graphviz";
import { dot } from "../../graphviz/tests/dot001.ts";
import { svg2pdf } from "@hpcc-js/wasm-svg2pdf";

describe("svg2pdf", function () {

    it("simple", async function () {
        const graphviz = await Graphviz.load();
        const svg = graphviz.layout(dot, "svg");
        const pdf = svg2pdf(svg);
        expect(pdf).to.be.an.instanceof(Uint8Array);
        expect(pdf.length).to.be.greaterThan(0);
        writeFileSync("test.pdf", pdf);
    });

    it("simple2", async function () {
        const graphviz = await Graphviz.load();
        const svg = graphviz.layout(dot, "svg");
        const pdf = svg2pdf(svg);
        expect(pdf).to.be.an.instanceof(Uint8Array);
        expect(pdf.length).to.be.greaterThan(0);
        writeFileSync("test2.pdf", pdf);
    });
});
