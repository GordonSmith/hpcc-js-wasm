---
title: Base91
description: WebAssembly wrapper for the Base91 encoding library
outline: deep
---

# @hpcc-js/wasm-base91

This package provides a WebAssembly wrapper around the [Base91](https://base91.sourceforge.net/) library.  This allows for the encoding and decoding of binary data to a more compact form than Base64.

## Installation

::: code-group
```sh [npm]
npm install @hpcc-js/wasm-base91
```

```sh [yarn]
yarn add @hpcc-js/wasm-base91
```

```sh [pnpm]
pnpm add @hpcc-js/wasm-base91
```
:::

## Quick Start

```typescript
import { Base91 } from "@hpcc-js/wasm-base91";

const base91 = await Base91.load();

const encoded_data = await base91.encode(data);
const decoded_data = await base91.decode(encoded_data);
```

<!--@include: ../../docs/base91/src/base91/README.md-->

## Reference

* [API Documentation](https://hpcc-systems.github.io/hpcc-js-wasm/docs/base91/src/base91/classes/Base91.html)

---

## Java (JVM)

The `wasm-base91` Java package runs the same WebAssembly module on any JVM using
[Endive](https://endive.run/) — a pure-Java, zero-native-dependency WebAssembly
runtime.  No JNI, no platform-specific binaries; just add the JAR.

### Installation

::: code-group
```xml [Maven]
<dependency>
    <groupId>io.hpccsystems</groupId>
    <artifactId>wasm-base91</artifactId>
    <version>1.14.2</version>
</dependency>
```

```groovy [Gradle]
implementation 'io.hpccsystems:wasm-base91:1.14.2'
```
:::

### Quick Start

```java
import io.hpccsystems.wasm.base91.Base91;

// Load once and reuse (each instance is independent and not thread-safe).
try (Base91 base91 = Base91.load()) {

    byte[] data    = "Hello, World!".getBytes(StandardCharsets.UTF_8);
    String encoded = base91.encode(data);
    byte[] decoded = base91.decode(encoded);

    assert Arrays.equals(data, decoded);
    System.out.println("Base91 version: " + base91.version());
}
```

### How it works

The library bundles the compiled `base91lib.wasm` module inside the JAR as a
resource file.  At runtime, [Endive](https://endive.run/) — a
[Bytecode Alliance](https://bytecodealliance.org/) project — instantiates the
module with WASIp1 host support and executes it entirely on the JVM.

The WASM module is compiled from the same C++ source as the JavaScript build,
using Emscripten's `--standalone-wasm` flag to produce a WASI-compatible binary.
