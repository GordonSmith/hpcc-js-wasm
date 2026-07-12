# wasm-graphviz (Java)

[![Maven Central](https://img.shields.io/maven-central/v/org.hpccsystems/wasm-graphviz.svg)](https://central.sonatype.com/artifact/org.hpccsystems/wasm-graphviz)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

Java wrapper for the [Graphviz](https://graphviz.org/) graph-visualization
library, powered by the same WebAssembly module used by the JavaScript package.
The WASM module runs on any JVM via [Endive](https://endive.run/) — a
pure-Java, zero-native-dependency WebAssembly runtime.

> **No JNI. No native binaries. Ship a single JAR to every OS and
> architecture.**

## Requirements

| Requirement | Minimum |
| ----------- | ------- |
| Java        | 11      |
| Maven       | 3.9     |

> The `graphvizlib.wasm` resource is bundled inside the JAR automatically by
> the C++ build. Run `cmake --build <build-dir> --target graphvizlib_java` to
> generate it before running tests or publishing.

## Installation

### Maven

```xml
<dependency>
    <groupId>org.hpccsystems</groupId>
    <artifactId>wasm-graphviz</artifactId>
    <version>15.1.0</version>
</dependency>
```

### Gradle

```groovy
implementation 'org.hpccsystems:wasm-graphviz:15.1.0'
```

## Usage

```java
import org.hpccsystems.wasm.graphviz.Graphviz;

try (Graphviz graphviz = Graphviz.load()) {

    // Render a simple directed graph to SVG
    String svg = graphviz.layout("digraph { Hello -> World }", "svg", "dot");
    System.out.println(svg);

    // Use a different engine
    String neato = graphviz.layout("graph { a -- b -- c }", "svg", "neato");

    // Get DOT canonical form
    String canonical = graphviz.layout("digraph { b -> a -> c }", "dot", "dot");

    // Library version
    System.out.println("Graphviz version: " + graphviz.version());
}
```

### Supported formats

Any text-based Graphviz output format works: `svg`, `dot`, `plain`,
`plain-ext`, `json`, `dot_json`, `xdot_json`, `canon`. Binary formats
(e.g. `png`, `pdf`) are **not** supported in this Java bridge.

### Supported engines

`dot`, `neato`, `circo`, `fdp`, `sfdp`, `twopi`, `osage`, `patchwork`.

## How it works

1. **Build time** — The C++ source (`java_bridge.cpp`) is compiled with
   Emscripten using `--standalone-wasm`. This produces a WASI-compatible
   `graphvizlib.wasm` file that has no JavaScript runtime dependency.

2. **Runtime** — The JAR bundles the WASM file as a classpath resource.
   `Graphviz.load()` reads it, parses it with Endive's `Parser`, and
   instantiates it with full WASIp1 host support (so internal Graphviz
   libc calls are satisfied transparently). All layout calls pass DOT
   source through WASM linear memory.

## Publishing to Maven Central

See [`.github/workflows/publish-maven.yml`](../../.github/workflows/publish-maven.yml)
for the automated release workflow.
