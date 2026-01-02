# Separate Module Bundles

The `@hpcc-js/sfx-blob` package provides three import paths for optimal tree-shaking:

## Import Paths

### 1. Combined Module (default)
```typescript
import { SfxBlob, Compressor, Decompressor } from "@hpcc-js/sfx-blob";
```
- **Use when**: You need both compression and decompression
- **Bundle size**: ~8.7 KB (includes both WASM modules)
- **WASM included**: `sfxbloblib.wasm` (2.1 KB)

### 2. Compress-Only Module
```typescript
import { Compressor } from "@hpcc-js/sfx-blob/compress";
```
- **Use when**: Only compressing data (e.g., sending to server)
- **Bundle size**: ~1.8 KB (compress module only)
- **WASM included**: `compress.wasm` (1.1 KB)
- **Savings**: ~79% smaller than combined module

### 3. Decompress-Only Module
```typescript
import { Decompressor } from "@hpcc-js/sfx-blob/decompress";
```
- **Use when**: Only decompressing data (e.g., receiving from server)
- **Bundle size**: ~1.8 KB (decompress module only)
- **WASM included**: `decompress.wasm` (1.4 KB)
- **Savings**: ~79% smaller than combined module

## Bundle Size Comparison

| Import Path | JS Bundle | WASM Size | Total | Savings |
|------------|-----------|-----------|-------|---------|
| `@hpcc-js/sfx-blob` | 8.7 KB | 2.1 KB | 10.8 KB | baseline |
| `@hpcc-js/sfx-blob/compress` | 1.8 KB | 1.1 KB | 2.9 KB | -73% |
| `@hpcc-js/sfx-blob/decompress` | 1.8 KB | 1.4 KB | 3.2 KB | -70% |

## Usage Examples

### Client-Side Compression Only
```typescript
// compress-worker.ts - Send compressed data to server
import { Compressor } from "@hpcc-js/sfx-blob/compress";

const compressor = await Compressor.load();

async function uploadData(data: Uint8Array) {
    const compressed = compressor.compress(data);
    await fetch("/api/upload", {
        method: "POST",
        body: compressed
    });
}
```

### Client-Side Decompression Only
```typescript
// decompress-worker.ts - Receive compressed data from server
import { Decompressor } from "@hpcc-js/sfx-blob/decompress";

const decompressor = await Decompressor.load();

async function downloadData(): Promise<Uint8Array> {
    const response = await fetch("/api/download");
    const compressed = await response.text();
    return decompressor.decompress(compressed);
}
```

### Full Round-Trip
```typescript
// main.ts - Use combined module for both operations
import { SfxBlob } from "@hpcc-js/sfx-blob";

const sfx = await SfxBlob.load();

const data = new Uint8Array([1, 2, 3, 4, 5]);
const compressed = sfx.compress(data);
const decompressed = sfx.decompress(compressed);
```

## Webpack/Vite Configuration

The separate modules work with all modern bundlers that support tree-shaking:

### Webpack
```javascript
// webpack.config.js
module.exports = {
    resolve: {
        extensions: ['.ts', '.js']
    },
    optimization: {
        usedExports: true,
        sideEffects: false
    }
};
```

### Vite
```javascript
// vite.config.js
export default {
    build: {
        rollupOptions: {
            treeshake: true
        }
    }
};
```

### esbuild
```javascript
// Already optimized - no additional configuration needed
esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    treeShaking: true
});
```

## Migration Guide

### From Combined Import
```diff
- import { Compressor, Decompressor } from "@hpcc-js/sfx-blob";
+ import { Compressor } from "@hpcc-js/sfx-blob/compress";

const compressor = await Compressor.load();
// Decompressor no longer available (saves ~1.4 KB)
```

### Adding Decompress Later
```diff
  import { Compressor } from "@hpcc-js/sfx-blob/compress";
+ import { Decompressor } from "@hpcc-js/sfx-blob/decompress";

const compressor = await Compressor.load();
+ const decompressor = await Decompressor.load();
```

## Performance Impact

The separate modules have identical performance characteristics to the combined module:

- **Compression speed**: Same (uses identical WASM code)
- **Decompression speed**: Same (uses identical WASM code)
- **Memory usage**: Lower (only loads needed WASM module)
- **Network transfer**: Lower (smaller bundle size)

## Best Practices

1. **Use separate imports when possible** - Reduces bundle size by ~70-73%
2. **Load once, reuse instances** - Call `.load()` once and cache the result
3. **Lazy load if needed** - Use dynamic `import()` for further optimization
4. **Monitor bundle size** - Use webpack-bundle-analyzer or similar tools

```typescript
// Lazy loading example
async function getCompressor() {
    const { Compressor } = await import("@hpcc-js/sfx-blob/compress");
    return Compressor.load();
}
```

## TypeScript Support

All imports have full TypeScript type definitions:

```typescript
import type { Compressor } from "@hpcc-js/sfx-blob/compress";
import type { Decompressor } from "@hpcc-js/sfx-blob/decompress";
import type { SfxBlob } from "@hpcc-js/sfx-blob";

// Types are available without importing the implementation
function processCompressed(compressor: Compressor, data: Uint8Array): string {
    return compressor.compress(data);
}
```
