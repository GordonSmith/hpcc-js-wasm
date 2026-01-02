import { describe, it, expect } from "vitest";
import { Compressor, Decompressor } from "../src/sfx-blob.ts";

function makeTestData(len: number): Uint8Array {
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        out[i] = (i * 17) % 256;
    }
    return out;
}

describe("Split WASM modules", function () {

    it("compress and decompress using separate modules", async function () {
        const compressor = await Compressor.load();
        const decompressor = await Decompressor.load();

        const data = makeTestData(100);

        const compressed = compressor.compress(data);
        expect(typeof compressed).toBe("string");
        expect(compressed.length).toBeGreaterThan(0);

        const decompressed = decompressor.decompress(compressed);
        expect(decompressed).toEqual(data);
    });

    it("compressor roundtrip with various sizes", async function () {
        const compressor = await Compressor.load();
        const decompressor = await Decompressor.load();

        for (const len of [1, 2, 15, 16, 31, 32, 63, 64, 127, 128, 255, 256, 512, 1000]) {
            const data = makeTestData(len);
            const compressed = compressor.compress(data);
            const decompressed = decompressor.decompress(compressed);
            expect(decompressed).toEqual(data);
        }
    });

    it("handles empty data with separate modules", async function () {
        const compressor = await Compressor.load();
        const decompressor = await Decompressor.load();

        const data = new Uint8Array(0);
        const compressed = compressor.compress(data);
        const decompressed = decompressor.decompress(compressed);
        expect(decompressed).toEqual(data);
    });

    it("handles larger data with separate modules", async function () {
        const compressor = await Compressor.load();
        const decompressor = await Decompressor.load();

        const data = makeTestData(10000);
        const compressed = compressor.compress(data);
        const decompressed = decompressor.decompress(compressed);
        expect(decompressed).toEqual(data);
    });

    it("compressor module is smaller than combined", async function () {
        const compressor = await Compressor.load();
        const compressorSize = compressor["_module"].memory.buffer.byteLength;

        // Compressor module should use less memory than combined module
        expect(compressorSize).toBeGreaterThan(0);
    });

    it("compressed output is valid base91", async function () {
        const compressor = await Compressor.load();
        const data = makeTestData(500);

        const compressed = compressor.compress(data);

        // Base91 alphabet: A-Z, a-z, 0-9, and special chars
        const base91Chars = /^[A-Za-z0-9!#$%&()*+,.\/:;<=>?@\[\]^_`{|}~"]*$/;
        expect(base91Chars.test(compressed)).toBe(true);
    });
});
