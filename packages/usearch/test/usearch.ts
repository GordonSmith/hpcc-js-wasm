import { expect } from "chai";
import { USearchWasm } from "@hpcc-js/wasm-usearch";

describe("USearchWasm", function () {

    it("version", async function () {
        let usearch = await USearchWasm.load();
        expect(await USearchWasm.load()).to.equal(usearch);
        let v = usearch.version();
        expect(v).to.be.a.string;
        expect(v).to.equal("2.15.1");   //  Update README.md when this changes
        console.log("USearchWasm version: " + v);
        USearchWasm.unload();

        usearch = await USearchWasm.load();
        expect(await USearchWasm.load()).to.equal(usearch);
        v = usearch.version();
        expect(v).to.be.a.string;
        expect(v).to.not.be.empty;
        USearchWasm.unload();
    });

    it("simple", async function () {
        let usearchWasm = await USearchWasm.load();
        const index = usearchWasm.create(3);
        const v1 = new usearchWasm.VectorF32();
        v1.push_back(0.2);
        v1.push_back(0.6);
        v1.push_back(0.4);
        index.add(42n, v1);
    });
});
