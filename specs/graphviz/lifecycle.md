# Graphviz: loading, lifecycle and environments

Package: `@hpcc-js/wasm-graphviz`

### GV-LOAD-001: Loading reports the bundled Graphviz version

Status: implemented

After the library is loaded, it reports the version of the bundled Graphviz C library as
a `major.minor.patch` string.

Example: `16.1.0`

### GV-LOAD-002: Loading is memoised

Status: implemented

Loading the library several times in the same JavaScript context returns the same instance.
The WASM module is compiled once.

### GV-LOAD-003: Static disposal is idempotent and the library can be reloaded

Status: implemented

Calling `Graphviz.dispose()` discards the current instance, and calling it again has no further
effect. A later load returns a new, working instance. The deprecated `Graphviz.unload()` method
remains available as an alias.

### GV-LOAD-004: Disposing an instance unloads it (`using` support)

Status: implemented

An instance can be disposed explicitly or with a TypeScript `using` declaration. Each load
takes one reference to the shared instance and each disposal releases one. Releasing the last
reference unloads the library, so the next load returns a new instance. `Graphviz.dispose()`
unloads regardless of outstanding references. Disposing an instance that has
already been unloaded has no effect.

### GV-LOAD-005: Disposing one loaded scope does not invalidate another

Status: implemented

When the Graphviz library is loaded for more than one active `using` scope, leaving one scope
does not invalidate the Graphviz handle in another scope that is still active. The remaining
scope can continue to use Graphviz, and loading again after all active scopes have ended
returns a working instance. This requirement covers `using` scopes, not explicit `dispose()`
calls outside those scopes.

This applies to the Graphviz library in Node.js and browsers, including Node.js without
optional browser globals. It does not apply to the command-line interface.

Example: An inner `using graphviz2 = await Graphviz.load()` scope ends while an outer
`using graphviz1 = await Graphviz.load()` scope is still active; `graphviz1` can still render
a graph.

### GV-RESOURCE-001: Every resource handle supports explicit and scoped disposal

Status: implemented

Every public Graphviz object that owns or retains a WASM resource, including `Graphviz`,
`Graph`, and `Subgraph`, exposes a `dispose()` method and `[Symbol.dispose]`. Calling
`dispose()` releases the resource managed by that object. A JavaScript or TypeScript `using`
declaration releases it automatically when its scope ends.

This applies to the Graphviz library in Node.js and browsers, including Node.js without
optional browser globals. It does not apply to the command-line interface, which does not
expose these resource handles.

Example: `using graph = graphviz.createGraph("G");` releases the graph resource when the
scope ends; `graph.dispose()` releases it explicitly.

### GV-ENV-001: Renders in every supported environment

Status: implemented

The same DOT source renders to SVG in each supported environment:

* Node.js, imported in-process
* Node.js where the optional browser globals (`navigator`, `window`, `document`, `Worker`,
  `XMLHttpRequest`, `fetch`, `Blob`, `SharedArrayBuffer`) are absent
* a browser (Chromium)
* the `wasm-graphviz-cli` command line

Each environment is an acceptance-test driver, so every scenario of every spec runs against
each environment that supports it.
