# @hpcc-js/wasm-usearch

This package provides a WebAssembly wrapper around the [usearch](https://github.com/unum-cloud/usearch) library:  Smaller & Faster Single-File
Similarity Search & Clustering Engine for Vectors & 🔜 Texts.

## Installation

```sh
npm install @hpcc-js/wasm-usearch
```

## Quick Start

```typescript
import { USearch } from "@hpcc-js/wasm-usearch";

const usearch = await USearch.load();

const encoded_data = await usearch.encode(data);
const decoded_data = await usearch.decode(encoded_data);
```

## Reference

* [API Documentation](https://hpcc-systems.github.io/hpcc-js-wasm/usearch/src/usearch/classes/usearch.html)
