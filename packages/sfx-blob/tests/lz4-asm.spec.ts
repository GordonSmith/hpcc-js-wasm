import { describe, it, expect } from "vitest";
import { LZ4Asm } from "../src/lz4.ts";

function makePatterned(len: number): Uint8Array {
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        // Mix some repeats with some variation
        out[i] = (i % 64) < 48 ? 0x41 : ((i * 17) & 0xff);
    }
    return out;
}

describe("lz4-asm", function () {

    it("roundtrip small", async function () {
        const lz4 = await LZ4Asm.load();
        for (const len of [0, 1, 2, 3, 4, 5, 15, 16, 31, 32, 63, 64, 127, 128]) {
            const data = makePatterned(len);
            const compressed = lz4.compress(data);
            const decompressed = lz4.decompress(compressed);
            expect(decompressed).to.deep.equal(data);
        }
    });

    it("roundtrip larger", async function () {
        const lz4 = await LZ4Asm.load();
        const data = makePatterned(64 * 1024);
        const compressed = lz4.compress(data);
        const decompressed = lz4.decompress(compressed);
        expect(decompressed).to.deep.equal(data);
    });

    it("compress output includes u32le length prefix", async function () {
        const lz4 = await LZ4Asm.load();
        const data = makePatterned(1234);
        const compressed = lz4.compress(data);
        expect(compressed.length).to.be.greaterThanOrEqual(4);
        const len = compressed[0] | (compressed[1] << 8) | (compressed[2] << 16) | (compressed[3] << 24);
        expect(len >>> 0).to.equal(data.length >>> 0);
    });
});
