package org.hpccsystems.wasm.base91;

import run.endive.runtime.ExportFunction;
import run.endive.runtime.HostFunction;
import run.endive.runtime.ImportValues;
import run.endive.runtime.Instance;
import run.endive.runtime.Memory;
import run.endive.wasm.Parser;
import run.endive.wasm.types.FunctionType;
import run.endive.wasm.types.ValType;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Java wrapper for the <a href="https://base91.sourceforge.net/">Base91</a>
 * encoding library, powered by a WebAssembly module running on the JVM via
 * <a href="https://endive.run/">Endive</a>.
 *
 * <p>No native code, JNI, or platform-specific binaries are required — the
 * WASM module is bundled inside the JAR and executed entirely on the JVM.
 *
 * <h2>Usage</h2>
 * <pre>{@code
 * Base91 base91 = Base91.load();
 *
 * byte[] data    = "Hello, World!".getBytes(StandardCharsets.UTF_8);
 * String encoded = base91.encode(data);
 * byte[] decoded = base91.decode(encoded);
 * }</pre>
 *
 * <p>Instances are <em>not</em> thread-safe; create a separate instance per
 * thread or synchronise externally.
 */
public final class Base91 implements AutoCloseable {

    /** Resource path of the WASM module bundled in the JAR. */
    private static final String WASM_RESOURCE = "/base91lib.wasm";

    private final Instance  instance;
    private final Memory    memory;
    private final ExportFunction mallocFn;
    private final ExportFunction freeFn;
    private final ExportFunction encodeFn;
    private final ExportFunction decodeFn;
    private final ExportFunction versionFn;

    private boolean closed = false;

    private Base91(Instance instance) {
        this.instance  = instance;
        this.memory    = instance.memory();
        this.mallocFn  = instance.export("base91_malloc");
        this.freeFn    = instance.export("base91_free");
        this.encodeFn  = instance.export("base91_encode");
        this.decodeFn  = instance.export("base91_decode");
        this.versionFn = instance.export("base91_version");
    }

    /**
     * Loads and instantiates the Base91 WebAssembly module.
     *
     * @return a new {@code Base91} instance ready for use.
     * @throws IOException if the WASM resource cannot be found or read.
     * @throws RuntimeException if the WASM module fails to instantiate.
     */
    public static Base91 load() throws IOException {
        byte[] wasmBytes;
        try (InputStream is = Base91.class.getResourceAsStream(WASM_RESOURCE)) {
            if (is == null) {
                throw new IOException(
                    "WASM resource not found on classpath: " + WASM_RESOURCE +
                    ". Make sure the C++ build has been run first (cmake --build)."
                );
            }
            wasmBytes = is.readAllBytes();
        }

        var module = Parser.parse(wasmBytes);

        // The standalone-wasm module compiled by Emscripten only requires one
        // host import: emscripten_notify_memory_growth.  This is called
        // whenever the WASM linear memory grows; a no-op is fine here because
        // the Java side always re-reads the Memory object per call.
        var notifyMemGrowth = new HostFunction(
            "env",
            "emscripten_notify_memory_growth",
            FunctionType.of(
                List.of(ValType.I32), // memory index (always 0)
                List.of()             // returns nothing
            ),
            (inst, args) -> null
        );

        var instance = Instance.builder(module)
            .withImportValues(ImportValues.builder()
                .addFunction(notifyMemGrowth)
                .build())
            .build();

        // Run the Emscripten standalone-wasm initialiser (sets up global state,
        // C++ static constructors, etc.).
        instance.export("_initialize").apply();

        return new Base91(instance);
    }

    /**
     * Returns the version string of the underlying Base91 library.
     *
     * @return version string, e.g. {@code "0.6.0"}.
     */
    public String version() {
        checkOpen();
        int bufPtr = malloc(16);
        try {
            int len = (int) versionFn.apply(bufPtr)[0];
            byte[] bytes = memory.readBytes(bufPtr, len);
            return new String(bytes, StandardCharsets.US_ASCII);
        } finally {
            free(bufPtr);
        }
    }

    /**
     * Encodes binary data as a Base91 ASCII string.
     *
     * @param data the bytes to encode; must not be {@code null}.
     * @return Base91-encoded string.
     */
    public String encode(byte[] data) {
        checkOpen();
        if (data == null) throw new IllegalArgumentException("data must not be null");

        // Upper bound for Base91 output: roughly 1.25× input + a small constant.
        int maxOut = data.length * 2 + 4;

        int inPtr  = malloc(Math.max(data.length, 1));
        int outPtr = malloc(maxOut);
        try {
            memory.write(inPtr, data);
            int outLen = (int) encodeFn.apply(inPtr, data.length, outPtr)[0];
            byte[] outBytes = memory.readBytes(outPtr, outLen);
            return new String(outBytes, StandardCharsets.US_ASCII);
        } finally {
            free(inPtr);
            free(outPtr);
        }
    }

    /**
     * Decodes a Base91 ASCII string back to the original bytes.
     *
     * @param encoded the Base91-encoded string; must not be {@code null}.
     * @return decoded bytes.
     */
    public byte[] decode(String encoded) {
        checkOpen();
        if (encoded == null) throw new IllegalArgumentException("encoded must not be null");

        byte[] encodedBytes = encoded.getBytes(StandardCharsets.US_ASCII);

        int inPtr  = malloc(Math.max(encodedBytes.length, 1));
        // Decoded output is always smaller than the encoded input.
        int outPtr = malloc(Math.max(encodedBytes.length, 1));
        try {
            memory.write(inPtr, encodedBytes);
            int outLen = (int) decodeFn.apply(inPtr, encodedBytes.length, outPtr)[0];
            return memory.readBytes(outPtr, outLen);
        } finally {
            free(inPtr);
            free(outPtr);
        }
    }

    /**
     * Releases the Endive instance.  The object must not be used after this
     * call.
     */
    @Override
    public void close() {
        closed = true;
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    private int malloc(int size) {
        return (int) mallocFn.apply(size)[0];
    }

    private void free(int ptr) {
        freeFn.apply(ptr);
    }

    private void checkOpen() {
        if (closed) throw new IllegalStateException("Base91 instance has been closed");
    }
}
