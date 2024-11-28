import { writeFileSync, readFileSync } from "fs";
import { describe, it, expect } from "vitest";
import { Graphviz } from "@hpcc-js/wasm-graphviz";
import { dot } from "../../graphviz/tests/dot001.ts";
import { svg2pdf } from "../src/index.ts";

describe("svg2pdf", function () {

    it("simple", async function () {
        const graphviz = await Graphviz.load();
        const svg = graphviz.layout(dot, "svg");
        writeFileSync("test.svg", svg);
        const roboto = readFileSync("./fonts/NotoSerif-Regular.ttf");
        const pdf = svg2pdf(svg, roboto);
        expect(pdf).to.be.an.instanceof(Uint8Array);
        expect(pdf.length).to.be.greaterThan(0);
        writeFileSync("test.pdf", pdf);
    });

    it("simple2", async function () {
        const graphviz = await Graphviz.load();
        const svg = graphviz.layout(dot, "svg");
        writeFileSync("test2.svg", svg);
        const roboto = readFileSync("./fonts/Roboto-Regular.ttf");
        const pdf = svg2pdf(svg, roboto);
        expect(pdf).to.be.an.instanceof(Uint8Array);
        expect(pdf.length).to.be.greaterThan(0);
        writeFileSync("test2.pdf", pdf);
    });
});
