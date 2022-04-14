import { expect } from "chai";
import { compress, decompress, version } from "../zlib";

describe("zlib", function () {

    it("version", async function () {
        const v = await version();
        expect(v).to.be.a.string;
        expect(v).to.not.be.empty;
    });

    it("compression", async function () {
        const str = "The quick brown fox jumps over the lazy dog.  The quick brown fox jumps over the lazy dog.";
        const buff = await compress(str);
        expect(buff.length()).to.be.greaterThan(0);
        expect(buff.length()).to.be.lessThan(str.length);
        const str2 = await decompress(buff);
        expect(str2).to.equal(str);
    });

});
