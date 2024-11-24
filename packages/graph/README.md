# @hpcc-js/wasm-graph

This package provides a WebAssembly wrapper around the [Graph](https://graph.sourceforge.net/) library.  This allows for the encoding and decoding of binary data to a more compact form than Base64.

## Installation

```sh
npm install @hpcc-js/wasm-graph
```

## Quick Start

```typescript
import { Graph } from "@hpcc-js/wasm-graph";

const graph = await Graph.load();

const encoded_data = await graph.encode(data);
const decoded_data = await graph.decode(encoded_data);
```

## Reference

* [API Documentation](https://hpcc-systems.github.io/hpcc-js-wasm/graph/src/graph/classes/Graph.html)
