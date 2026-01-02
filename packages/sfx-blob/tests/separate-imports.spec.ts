import { describe, it, expect } from "vitest";

describe("Separate module imports", function () {

    it("can import Compressor from /compress", async function () {
        const { Compressor } = await import("../src/index-compress.ts");
        const compressor = await Compressor.load();

        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const compressed = compressor.compress(data);

        expect(typeof compressed).toBe("string");
        expect(compressed.length).toBeGreaterThan(0);
    });

    it("can import Decompressor from /decompress", async function () {
        const { Decompressor } = await import("../src/index-decompress.ts");
        const decompressor = await Decompressor.load();

        // Use a known compressed string
        const { Compressor } = await import("../src/index-compress.ts");
        const compressor = await Compressor.load();
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const compressed = compressor.compress(data);

        const decompressed = decompressor.decompress(compressed);
        expect(decompressed).toEqual(data);
    });

    it("compress and decompress modules are independent", async function () {
        const { Compressor } = await import("../src/index-compress.ts");
        const { Decompressor } = await import("../src/index-decompress.ts");

        const compressor = await Compressor.load();
        const decompressor = await Decompressor.load();

        const data = new Uint8Array(100);
        for (let i = 0; i < 100; i++) data[i] = i;

        const compressed = compressor.compress(data);
        const decompressed = decompressor.decompress(compressed);

        expect(decompressed).toEqual(data);
    });

    it("separate imports work alongside combined import", async function () {
        const { Compressor } = await import("../src/index-compress.ts");
        const { Decompressor } = await import("../src/index-decompress.ts");
        const { SfxBlob } = await import("../src/sfx-blob.ts");

        const compressor = await Compressor.load();
        const decompressor = await Decompressor.load();
        const sfx = await SfxBlob.load();

        const data = new Uint8Array([10, 20, 30, 40, 50]);

        // All three should produce compatible outputs
        const c1 = compressor.compress(data);
        const c2 = sfx.compress(data);

        expect(c1).toBe(c2);

        const d1 = decompressor.decompress(c1);
        const d2 = sfx.decompress(c1);

        expect(d1).toEqual(data);
        expect(d2).toEqual(data);
    });
});
