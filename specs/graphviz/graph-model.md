# Graphviz: graph model and graph tools

Package: `@hpcc-js/wasm-graphviz`. API: `createGraph()`, `read()`, `Graph`, `acyclic()`,
`tred()`, `unflatten()`.

### GV-GRAPH-001: A graph can be built from nodes, edges and clusters

Status: implemented

A graph built in code from nodes, edges and clusters reports the number of nodes, edges and
clusters it contains. Its DOT serialisation includes every node and edge.

### GV-GRAPH-002: A built graph can be rendered

Status: implemented

A graph built in code renders to SVG directly, without first being written out as DOT, and
the SVG contains every node.

### GV-GRAPH-003: DOT can be read into a graph model

Status: implemented

Reading DOT source produces a graph model whose node names and edge count match the source.

Example: `digraph { x -> y -> z }` has nodes `x`, `y`, `z` and 2 edges.

### GV-TOOLS-001: `acyclic` detects and breaks cycles

Status: implemented

For a directed graph that contains cycles, `acyclic` reports that the graph was cyclic and
how many edges it reversed. With output enabled, it returns DOT for the resulting acyclic
graph. For a graph without cycles, it reports that the graph was not cyclic and that no
edges were reversed.

### GV-TOOLS-002: `tred` computes the transitive reduction

Status: implemented

`tred` removes edges that are implied by other paths.

Example: `digraph { a -> b; b -> c; a -> c }` reduces to the edges `a -> b` and `b -> c`.

### GV-TOOLS-003: `unflatten` staggers fan-out edges

Status: implemented

`unflatten` with a maximum `minlen` of N assigns alternating `minlen` values from 1 to N to
the edges of a node with a large fan-out.
