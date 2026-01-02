import { describe, it, expect } from "vitest";
import { Base91 } from "@hpcc-js/wasm-base91";
import { Base91Asm } from "../src/base91.ts";

describe("sfx-blob", function () {

    it("roundtrip", async function () {
        const base91 = await Base91Asm.load();
        const data = new Uint8Array(Array.from({ length: 1000 }, (_, i) => i % 256));
        const encoded = base91.encode(data);
        const decoded = base91.decode(encoded);
        expect(decoded).to.deep.equal(data);
    });

    it("matches wasm-base91 output", async function () {
        const ref = await Base91.load();
        const asm = await Base91Asm.load();
        const data = new Uint8Array(Array.from({ length: 257 }, (_, i) => (i * 17) % 256));
        expect(asm.encode(data)).to.equal(ref.encode(data));
    });
});
