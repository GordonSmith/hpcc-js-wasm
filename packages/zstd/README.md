# @hpcc-js/wasm-graphviz

This package provides a WebAssembly wrapper around the [Graphviz](https://www.graphviz.org/) library.  This allows for the rendering of DOT language graphs directly within a browser or NodeJS type environment.

## Installation

```sh
npm install @hpcc-js/wasm-graphviz
```

## Usage

```typescript
import { Graphviz } from "@hpcc-js/wasm-graphviz";

const graphviz = await Graphviz.load();
const svg = graphviz.dot(`digraph { a -> b; }`);
document.body.innerHTML = svg;
```

