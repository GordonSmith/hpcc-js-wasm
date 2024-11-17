# @hpcc-js/wasm-zstd

This package provides a WebAssembly wrapper around the [Zstandard](https://facebook.github.io/zstd/) library.  This provides efficient compression and decompression of data.

## Installation

```sh
npm install @hpcc-js/wasm-zstd
```

## Usage

```typescript
import { Zstd } from "@hpcc-js/wasm-zstd";

const zstd = await Zstd.load();

//  Generate some "data"
const data = new Uint8Array(Array.from({ length: 100000 }, (_, i) => i % 256));

const compressed_data = zstd.compress(data);
const decompressed_data = zstd.decompress(compressed_data);
```

## Reference

* [API Documentation](https://hpcc-systems.github.io/hpcc-js-wasm/zstd/src/zstd/classes/Zstd.html)
