# wasm-base91 (Java)

[![Maven Central](https://img.shields.io/maven-central/v/io.github.hpcc-systems/wasm-base91.svg)](https://central.sonatype.com/artifact/io.github.hpcc-systems/wasm-base91)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

Java wrapper for the [Base91](https://base91.sourceforge.net/) encoding
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

> The `base91lib.wasm` resource is bundled inside the JAR automatically by
> the C++ build. Run `cmake --build <build-dir> --target base91lib_java` to
> generate it before running tests or publishing.

## Installation

### Maven

```xml
<dependency>
    <groupId>org.hpccsystems</groupId>
    <artifactId>wasm-base91</artifactId>
    <version>1.14.2</version>
</dependency>
```

### Gradle

```groovy
implementation 'org.hpccsystems:wasm-base91:1.14.2'
```

## Usage

```java
import org.hpccsystems.wasm.base91.Base91;
import java.nio.charset.StandardCharsets;

// Load the WASM module (inexpensive, but not thread-safe — create one
// instance per thread or synchronise externally).
try (Base91 base91 = Base91.load()) {

    byte[] original = "Hello, World!".getBytes(StandardCharsets.UTF_8);

    // Encode
    String encoded = base91.encode(original);
    System.out.println("Encoded: " + encoded);

    // Decode
    byte[] decoded = base91.decode(encoded);
    System.out.println("Round-trip OK: " + java.util.Arrays.equals(original, decoded));

    // Library version
    System.out.println("Base91 version: " + base91.version());
}
```

## How it works

1. **Build time** — The C++ source (`java_bridge.cpp`) is compiled with
   Emscripten using `--standalone-wasm`. This produces a WASI-compatible
   `base91lib.wasm` file that has no JavaScript runtime dependency.

2. **Runtime** — The JAR bundles the WASM file as a classpath resource.
   `Base91.load()` reads it, parses it with Endive's `Parser`, and
   instantiates it with WASIp1 host support. All encode/decode calls pass
   data through the WASM linear memory via Endive's `Memory` API.

## Publishing to Maven Central

Maven Central publication is handled by the
[`publish-maven.yml`](../../.github/workflows/publish-maven.yml) GitHub
Actions workflow, which is triggered automatically by the release workflow.

The following repository secrets must be configured:

| Secret                   | Purpose                                |
| ------------------------ | -------------------------------------- |
| `MAVEN_CENTRAL_USERNAME` | Sonatype Central Portal token username |
| `MAVEN_CENTRAL_PASSWORD` | Sonatype Central Portal token password |
| `GPG_PRIVATE_KEY`        | ASCII-armoured GPG private key         |
| `GPG_PASSPHRASE`         | GPG key passphrase                     |

## License

Apache-2.0 — see [LICENSE](../../LICENSE).
