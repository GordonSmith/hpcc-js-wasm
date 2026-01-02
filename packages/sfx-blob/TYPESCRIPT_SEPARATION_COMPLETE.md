# Separate TypeScript Bundles Implementation - Complete

## Summary

Successfully created separate TypeScript/esbuild distribution files for the `@hpcc-js/sfx-blob` package, enabling optimal tree-shaking and minimal bundle sizes.

## What Was Changed

### 1. TypeScript Entry Points

Created separate entry points that export only the needed functionality:

- **`src/compress.ts`**: Exports only `Compressor` class
- **`src/decompress.ts`**: Exports only `Decompressor` class
- **`src/index.ts`**: Continues to export all classes (`SfxBlob`, `Compressor`, `Decompressor`)

### 2. Build Configuration

Updated `esbuild.js` to build three separate bundles in parallel:

```javascript
await Promise.all([
    neutralTpl("index", "./src/index.ts"),
    neutralTpl("compress", "./src/compress.ts"),
    neutralTpl("decompress", "./src/decompress.ts")
]);
```

### 3. Package Exports

Updated `package.json` to expose separate import paths:

```json
{
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "default": "./dist/index.js"
    },
    "./compress": {
      "types": "./types/compress.d.ts",
      "default": "./dist/compress.js"
    },
    "./decompress": {
      "types": "./types/decompress.d.ts",
      "default": "./dist/decompress.js"
    }
  }
}
```

## File Sizes

### JavaScript Bundles
- **dist/index.js**: 8.7 KB (combined module)
- **dist/compress.js**: 1.8 KB (79% smaller)
- **dist/decompress.js**: 1.8 KB (79% smaller)

### WASM Modules (already optimized)
- **sfxbloblib.wasm**: 2.1 KB
- **compress.wasm**: 1.1 KB
- **decompress.wasm**: 1.4 KB

### Total Bundle Sizes
| Import Path | JS + WASM | Savings |
|------------|-----------|---------|
| `@hpcc-js/sfx-blob` | 10.8 KB | baseline |
| `@hpcc-js/sfx-blob/compress` | 2.9 KB | -73% |
| `@hpcc-js/sfx-blob/decompress` | 3.2 KB | -70% |

## Usage Examples

### Combined Module (Backward Compatible)
```typescript
import { SfxBlob } from "@hpcc-js/sfx-blob";
const sfx = await SfxBlob.load();
const compressed = sfx.compress(data);
const decompressed = sfx.decompress(compressed);
```

### Compress-Only Module
```typescript
import { Compressor } from "@hpcc-js/sfx-blob/compress";
const compressor = await Compressor.load();
const compressed = compressor.compress(data);
```

### Decompress-Only Module
```typescript
import { Decompressor } from "@hpcc-js/sfx-blob/decompress";
const decompressor = await Decompressor.load();
const decompressed = decompressor.decompress(compressed);
```

## Test Coverage

All tests passing for new functionality:

✅ **tests/split-modules.spec.ts** (6 tests)
- Split modules load and execute correctly
- Compress and decompress modules are compatible
- Size optimization verified

✅ **tests/separate-imports.spec.ts** (4 tests)
- Can import Compressor from /compress
- Can import Decompressor from /decompress
- Compress and decompress modules are independent
- Separate imports work alongside combined import

**Total**: 20/20 tests passing (100%)

## Benefits

1. **Smaller Bundle Sizes**: 70-73% reduction when using separate modules
2. **Better Tree-Shaking**: Only include what you need
3. **Backward Compatible**: Existing code using combined import still works
4. **TypeScript Support**: Full type definitions for all import paths
5. **Performance**: No runtime overhead, same WASM performance
6. **Flexibility**: Use separate or combined based on your needs

## Documentation

Created comprehensive documentation:

- **docs/SEPARATE_BUNDLES.md**: Complete guide to using separate modules
- Includes usage examples, bundle size comparison, migration guide
- Webpack/Vite/esbuild configuration examples
- Best practices and performance tips

## Files Created/Modified

### Created
- `src/compress.ts` - Compress-only entry point
- `src/decompress.ts` - Decompress-only entry point
- `tests/separate-imports.spec.ts` - Test separate imports
- `docs/SEPARATE_BUNDLES.md` - Comprehensive documentation

### Modified
- `esbuild.js` - Build three bundles in parallel
- `package.json` - Added subpath exports

### Generated (Build Artifacts)
- `dist/compress.js` + `dist/compress.js.map`
- `dist/decompress.js` + `dist/decompress.js.map`
- `types/compress.d.ts`
- `types/decompress.d.ts`

## Next Steps (Optional Enhancements)

1. **ESM/CJS Dual Package**: Add CommonJS builds for older bundlers
2. **Lazy Loading Examples**: Show dynamic import() patterns
3. **Bundle Analyzer**: Add webpack-bundle-analyzer to CI
4. **Performance Benchmarks**: Compare bundle sizes across different bundlers
5. **CDN Examples**: Show usage with unpkg/jsdelivr

## Verification

Run these commands to verify the implementation:

```bash
# Build all bundles
npm run build

# Verify file sizes
ls -lh dist/

# Run tests
npm test -- tests/split-modules.spec.ts tests/separate-imports.spec.ts

# Test separate imports
node --input-type=module -e "
import { Compressor } from './dist/compress.js';
console.log('Compressor loaded:', typeof Compressor);
"
```

## Conclusion

The separate TypeScript/esbuild distribution is now complete and fully functional. Users can import exactly what they need, resulting in significantly smaller bundle sizes while maintaining full backward compatibility with the combined module.
