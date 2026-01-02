import { describe, it, expect } from "vitest";
import { SfxBlob } from "../src/sfx-blob.ts";

function makeTestData(len: number): Uint8Array {
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        out[i] = (i * 17) % 256;
    }
    return out;
}

describe("SfxBlob compress/decompress", function () {

    it("roundtrip small data", async function () {
        const sfx = await SfxBlob.load();
        const data = makeTestData(100);

        const compressed = sfx.compress(data);
        expect(typeof compressed).toBe("string");
        expect(compressed.length).toBeGreaterThan(0);

        const decompressed = sfx.decompress(compressed);
        expect(decompressed).toEqual(data);
    });

    it("roundtrip empty data", async function () {
        const sfx = await SfxBlob.load();
        const data = new Uint8Array(0);

        const compressed = sfx.compress(data);
        const decompressed = sfx.decompress(compressed);
        expect(decompressed).toEqual(data);
    });

    it("roundtrip various sizes", async function () {
        const sfx = await SfxBlob.load();

        for (const len of [1, 2, 15, 16, 31, 32, 63, 64, 127, 128, 255, 256, 512, 1000]) {
            const data = makeTestData(len);
            const compressed = sfx.compress(data);
            const decompressed = sfx.decompress(compressed);
            expect(decompressed).toEqual(data);
        }
    });

    it("roundtrip larger data", async function () {
        const sfx = await SfxBlob.load();
        const data = makeTestData(10000);

        const compressed = sfx.compress(data);
        const decompressed = sfx.decompress(compressed);
        expect(decompressed).toEqual(data);
    });

    it("compressed output is a valid base91 string", async function () {
        const sfx = await SfxBlob.load();
        const data = makeTestData(500);

        const compressed = sfx.compress(data);

        // Base91 alphabet: A-Z, a-z, 0-9, and special chars
        const base91Chars = /^[A-Za-z0-9!#$%&()*+,.\/:;<=>?@\[\]^_`{|}~"]*$/;
        expect(base91Chars.test(compressed)).toBe(true);
    });

    it("handles compressible data (repetitive pattern)", async function () {
        const sfx = await SfxBlob.load();

        // Create highly compressible data
        const data = new Uint8Array(1000);
        data.fill(0x41); // Fill with 'A'

        const compressed = sfx.compress(data);
        const decompressed = sfx.decompress(compressed);

        expect(decompressed).toEqual(data);
        // Note: Base91 encoding adds overhead, so compressed size may be larger than original
        // But the test verifies that compression+decompression works correctly
    });

    it("handles incompressible data (random)", async function () {
        const sfx = await SfxBlob.load();

        // Create pseudo-random incompressible data
        const data = new Uint8Array(500);
        for (let i = 0; i < data.length; i++) {
            data[i] = ((i * 31 + 17) * 13) % 256;
        }

        const compressed = sfx.compress(data);
        const decompressed = sfx.decompress(compressed);

        expect(decompressed).toEqual(data);
    });
});
