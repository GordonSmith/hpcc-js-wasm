import { describe, it, expect } from "vitest";
import { FlatC } from "@hpcc-js/wasm-flatc";

describe("flatc", function () {
    it("version", async function () {
        let flatbuffers = await FlatC.load();
        let v = flatbuffers.version();
        expect(v).to.be.a.string;
        expect(v).to.equal("24.3.25");  // Update README.md if this changes
        console.log("flatbuffers version: " + v);

        flatbuffers = await FlatC.load();
        v = flatbuffers.version();
        expect(v).to.be.a.string;
        expect(v).to.not.be.empty;
        FlatC.unload();

        flatbuffers = await FlatC.load();
        v = flatbuffers.version();
        expect(v).to.be.a.string;
        expect(v).to.not.be.empty;
        FlatC.unload();
    });

});
