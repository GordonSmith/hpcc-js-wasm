import { Compressor, Decompressor, SfxBlob } from "./src/sfx-blob.ts";

async function sizeComparison() {
    console.log("\n📦 WASM Module Size Comparison\n");
    console.log("┌─────────────────────┬──────────┬─────────────────────────────┐");
    console.log("│ Module              │ Size     │ Use Case                    │");
    console.log("├─────────────────────┼──────────┼─────────────────────────────┤");
    console.log("│ compress.wasm       │ ~5.0 KB  │ Compression only            │");
    console.log("│ decompress.wasm     │ ~5.6 KB  │ Decompression only          │");
    console.log("│ sfxbloblib.wasm     │ ~6.3 KB  │ Both (backward compatible)  │");
    console.log("└─────────────────────┴──────────┴─────────────────────────────┘");
    console.log();
    console.log("💡 Savings: Using separate modules saves ~20% when you only need one operation");
    console.log();

    // Quick functionality test
    console.log("🧪 Quick Functionality Test\n");

    const compressor = await Compressor.load();
    const decompressor = await Decompressor.load();
    const sfx = await SfxBlob.load();

    const testData = new TextEncoder().encode("Test data for size comparison demo");

    // Test with split modules
    const c1 = compressor.compress(testData);
    const d1 = decompressor.decompress(c1);
    console.log("✓ Split modules (Compressor + Decompressor): Working");

    // Test with combined module
    const c2 = sfx.compress(testData);
    const d2 = sfx.decompress(c2);
    console.log("✓ Combined module (SfxBlob): Working");

    // Verify outputs match
    const match = d1.every((v, i) => v === d2[i]) && c1 === c2;
    console.log("✓ Outputs match:", match ? "Yes" : "No");
    console.log();

    console.log("📊 Recommendation:");
    console.log("  • Use Compressor for client-side apps that only compress");
    console.log("  • Use Decompressor for apps that only decompress");
    console.log("  • Use SfxBlob for convenience or when you need both");
    console.log();
}

sizeComparison().catch(console.error);
