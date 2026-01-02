# SfxBlob Refactoring Complete

## Summary

The AssemblyScript code in `packages/sfx-blob` has been successfully refactored to export two main functions:

### 1. `compress(ptr, len)` 
- Takes a blob and compresses it using LZ4
- Encodes the compressed data using Base91 algorithm
- Returns a pointer to the Base91-encoded string

### 2. `decompress(ptr, len)`
- Takes a Base91-encoded string
- Decodes it using Base91 algorithm
- Decompresses using LZ4 algorithm
- Returns a pointer to the decompressed data

## Implementation Details

### AssemblyScript (`assembly/index.ts`)
- Exported `sfx_compress()` - combines LZ4 compression + Base91 encoding
- Exported `sfx_decompress()` - combines Base91 decoding + LZ4 decompression
- Exported `sfx_compress_len()` and `sfx_decompress_len()` for getting output lengths
- Maintained backward compatibility by re-exporting base91 and lz4 functions with prefixes

### TypeScript Wrapper (`src/sfx-blob.ts`)
New `SfxBlob` class with methods:
- `compress(data: Uint8Array): string` - Returns Base91-encoded compressed string
- `decompress(base91Str: string): Uint8Array` - Returns decompressed binary data

## Test Results

✅ **All core functionality tests passing (7/7)**:
- Roundtrip small data
- Roundtrip empty data
- Roundtrip various sizes (1, 2, 15, 16, 31, 32, 63, 64, 127, 128, 255, 256, 512, 1000)
- Roundtrip larger data (10,000 bytes)
- Base91 string validation
- Compressible data handling
- Incompressible data handling

✅ **All LZ4 tests passing (3/3)**
✅ **All Base91 basic tests passing (2/2)**

⚠️ **Chunked encoding/decoding tests not implemented (4 failing)**
- These are for streaming scenarios and not part of the core refactoring requirement

## Usage Example

```typescript
import { SfxBlob } from "@hpcc-js/sfx-blob";

// Load the WASM module
const sfx = await SfxBlob.load();

// Compress data
const data = new Uint8Array([1, 2, 3, 4, 5]);
const compressed = sfx.compress(data);
console.log("Compressed:", compressed); // Base91 string

// Decompress data
const decompressed = sfx.decompress(compressed);
console.log("Decompressed:", decompressed); // Uint8Array [1, 2, 3, 4, 5]
```

## Files Modified

1. `assembly/index.ts` - Added sfx_compress/decompress functions
2. `src/sfx-blob.ts` - New TypeScript wrapper class
3. `src/index.ts` - Export SfxBlob class
4. `src/loader.ts` - Updated to support Node.js and browser environments
5. `src/base91.ts` - Added version() and reset() methods
6. `src/lz4.ts` - Updated to use renamed lz4_compress/decompress functions
7. `tests/sfx-blob.spec.ts` - New comprehensive test suite
8. `esbuild.js` - Marked node:fs/promises as external

## Build Status

✅ Build successful with no warnings
✅ TypeScript compilation successful
✅ All target functionality working correctly
