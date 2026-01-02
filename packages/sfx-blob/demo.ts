import { SfxBlob } from "./src/sfx-blob.ts";

async function demo() {
    console.log("Loading SfxBlob WASM module...");
    const sfx = await SfxBlob.load();
    console.log("✓ Module loaded\n");

    // Example 1: Simple text compression
    console.log("Example 1: Text Compression");
    console.log("============================");
    const text = "Hello, World! This is a test of the SfxBlob compression system.";
    const textData = new TextEncoder().encode(text);
    console.log("Original text:", text);
    console.log("Original size:", textData.length, "bytes");

    const compressed = sfx.compress(textData);
    console.log("Compressed (Base91):", compressed);
    console.log("Compressed size:", compressed.length, "characters");
    console.log("Compression ratio:", ((compressed.length / textData.length) * 100).toFixed(1) + "%");

    const decompressed = sfx.decompress(compressed);
    const decompressedText = new TextDecoder().decode(decompressed);
    console.log("Decompressed text:", decompressedText);
    console.log("Match:", decompressedText === text ? "✓" : "✗");
    console.log();

    // Example 2: Binary data compression
    console.log("Example 2: Binary Data Compression");
    console.log("===================================");
    const binaryData = new Uint8Array(1000);
    binaryData.fill(42); // Highly compressible
    console.log("Original size:", binaryData.length, "bytes (filled with 42)");

    const compressedBinary = sfx.compress(binaryData);
    console.log("Compressed size:", compressedBinary.length, "characters");
    console.log("Compression ratio:", ((compressedBinary.length / binaryData.length) * 100).toFixed(1) + "%");

    const decompressedBinary = sfx.decompress(compressedBinary);
    console.log("Decompressed size:", decompressedBinary.length, "bytes");
    console.log("Match:", decompressedBinary.every((v, i) => v === binaryData[i]) ? "✓" : "✗");
    console.log();

    // Example 3: Random data (incompressible)
    console.log("Example 3: Random Data (Incompressible)");
    console.log("========================================");
    const randomData = new Uint8Array(500);
    for (let i = 0; i < randomData.length; i++) {
        randomData[i] = ((i * 31 + 17) * 13) % 256;
    }
    console.log("Original size:", randomData.length, "bytes");

    const compressedRandom = sfx.compress(randomData);
    console.log("Compressed size:", compressedRandom.length, "characters");
    console.log("Compression ratio:", ((compressedRandom.length / randomData.length) * 100).toFixed(1) + "%");
    console.log("Note: Random data doesn't compress well, may expand due to encoding overhead");

    const decompressedRandom = sfx.decompress(compressedRandom);
    console.log("Decompressed size:", decompressedRandom.length, "bytes");
    console.log("Match:", decompressedRandom.every((v, i) => v === randomData[i]) ? "✓" : "✗");
    console.log();

    console.log("All demos completed successfully! ✓");
}

demo().catch(console.error);
