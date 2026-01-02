import { Compressor, Decompressor, SfxBlob } from "./src/sfx-blob.ts";

async function demoSplitModules() {
    console.log("=".repeat(60));
    console.log("Split WASM Modules Demo");
    console.log("=".repeat(60));
    console.log();

    // Example 1: Using separate compress/decompress modules
    console.log("Example 1: Using Separate Modules");
    console.log("-".repeat(60));

    const compressor = await Compressor.load();
    const decompressor = await Decompressor.load();
    console.log("✓ Loaded separate compress and decompress modules");
    console.log();

    const text = "Hello from split WASM modules! This demonstrates independent compress/decompress.";
    const textData = new TextEncoder().encode(text);
    console.log("Original text:", text);
    console.log("Original size:", textData.length, "bytes");
    console.log();

    const compressed = compressor.compress(textData);
    console.log("Compressed (using compress.wasm):", compressed.substring(0, 50) + "...");
    console.log("Compressed size:", compressed.length, "characters");
    console.log();

    const decompressed = decompressor.decompress(compressed);
    const decompressedText = new TextDecoder().decode(decompressed);
    console.log("Decompressed (using decompress.wasm):", decompressedText);
    console.log("Match:", decompressedText === text ? "✓" : "✗");
    console.log();

    // Example 2: Using combined module for comparison
    console.log("Example 2: Using Combined Module (Backward Compatibility)");
    console.log("-".repeat(60));

    const sfx = await SfxBlob.load();
    console.log("✓ Loaded combined sfxbloblib.wasm module");
    console.log();

    const data = new Uint8Array(500);
    data.fill(42);
    console.log("Test data: 500 bytes (filled with 42)");

    const compressedCombined = sfx.compress(data);
    console.log("Compressed (combined module):", compressedCombined.length, "characters");

    const decompressedCombined = sfx.decompress(compressedCombined);
    console.log("Decompressed (combined module):", decompressedCombined.length, "bytes");
    console.log("Match:", decompressedCombined.every((v, i) => v === data[i]) ? "✓" : "✗");
    console.log();

    // Example 3: Module size comparison
    console.log("Example 3: Module Size Information");
    console.log("-".repeat(60));
    console.log("This package now provides three WASM files:");
    console.log("  • compress.wasm     - ~5.0 KB (compress only)");
    console.log("  • decompress.wasm   - ~5.6 KB (decompress only)");
    console.log("  • sfxbloblib.wasm   - ~6.3 KB (combined, backward compatible)");
    console.log();
    console.log("Benefits of split modules:");
    console.log("  • Smaller bundle size if you only need compress OR decompress");
    console.log("  • Faster initial load for single-purpose applications");
    console.log("  • Better code splitting in web applications");
    console.log();

    // Example 4: Interoperability test
    console.log("Example 4: Interoperability Test");
    console.log("-".repeat(60));
    console.log("Compress with Compressor, decompress with SfxBlob:");

    const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const comp1 = compressor.compress(testData);
    const decomp1 = sfx.decompress(comp1);
    console.log("  Match:", decomp1.every((v, i) => v === testData[i]) ? "✓" : "✗");

    console.log("Compress with SfxBlob, decompress with Decompressor:");
    const comp2 = sfx.compress(testData);
    const decomp2 = decompressor.decompress(comp2);
    console.log("  Match:", decomp2.every((v, i) => v === testData[i]) ? "✓" : "✗");
    console.log();

    console.log("=".repeat(60));
    console.log("All demos completed successfully! ✓");
    console.log("=".repeat(60));
}

demoSplitModules().catch(console.error);
