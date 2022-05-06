import { expect } from "chai";
import { decode, encode, load, stream_decode, stream_encode } from "./index";
const fs = require("fs/promises");

describe("base91", function () {
    this.timeout(5000);

    it("encode string", async function () {
        const str = "Hello and Welcome!";
        const d1 = new Uint8Array(Array.from(str).map(c => c.charCodeAt(0)));
        const s1 = await stream_encode(d1, "./dist");
        const s2 = await encode(d1, "./dist");
        expect(s1).to.equal(s2);
        const d2 = await stream_decode(s1, "./dist");
        const d3 = await decode(s2, "./dist");
        expect(d3).to.deep.equal(Array.from(d2));
        expect(d2).to.deep.equal(Array.from(d1));

    });

    it("encode file", async function () {
        const d1 = await fs.readFile("./dist/base91.wasm");
        const s1 = await stream_encode(d1, "./dist");
        const s2 = await encode(d1, "./dist");
        expect(s1).to.equal(s2);
        const d2 = await stream_decode(s1, "./dist");
        const d3 = await decode(s2, "./dist");
        expect(d3).to.deep.equal(Array.from(d2));
        expect(d2).to.deep.equal(Array.from(d1));
    });
});
