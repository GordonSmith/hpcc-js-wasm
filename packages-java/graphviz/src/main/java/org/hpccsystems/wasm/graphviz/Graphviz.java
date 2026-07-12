package org.hpccsystems.wasm.graphviz;

import run.endive.runtime.ExportFunction;
import run.endive.runtime.HostFunction;
import run.endive.runtime.ImportValues;
import run.endive.runtime.Instance;
import run.endive.runtime.Memory;
import run.endive.wasi.WasiOptions;
import run.endive.wasi.WasiPreview1;
import run.endive.wasm.Parser;
import run.endive.wasm.types.FunctionType;
import run.endive.wasm.types.ValType;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Java wrapper for the <a href="https://graphviz.org/">Graphviz</a>
 * graph-visualization library, powered by a WebAssembly module running on the
 * JVM via <a href="https://endive.run/">Endive</a>.
 *
 * <p>
 * No native code, JNI, or platform-specific binaries are required — the
 * WASM module is bundled inside the JAR and executed entirely on the JVM.
 *
 * <h2>Usage</h2>
 * 
 * <pre>{@code
 * try (Graphviz graphviz = Graphviz.load()) {
 *     String svg = graphviz.layout("digraph { Hello -> World }", "svg", "dot");
 *     System.out.println(svg);
 * }
 * }</pre>
 *
 * <p>
 * Instances are <em>not</em> thread-safe; create a separate instance per
 * thread or synchronise externally.
 *
 * <p>
 * Only text-based output formats are supported (e.g. {@code "svg"},
 * {@code "dot"}, {@code "plain"}, {@code "json"}). Binary formats such as
 * {@code "png"} are not supported in this Java bridge.
 */
public final class Graphviz implements AutoCloseable {

    /** Classpath resource path of the WASM module bundled in the JAR. */
    private static final String WASM_RESOURCE = "/graphvizlib.wasm";

    /** Buffer size reserved for error messages returned by graphviz. */
    private static final int ERROR_BUF_SIZE = 4096;

    /** Buffer size for the version string. */
    private static final int VERSION_BUF_SIZE = 64;

    private final Instance instance;
    private final Memory memory;
    private final ExportFunction mallocFn;
    private final ExportFunction freeFn;
    private final ExportFunction versionFn;
    private final ExportFunction layoutFn;
    private final ExportFunction getResultPtrFn;
    private final ExportFunction lastErrorFn;

    private boolean closed = false;

    private Graphviz(Instance instance) {
        this.instance = instance;
        this.memory = instance.memory();
        this.mallocFn = instance.export("graphviz_malloc");
        this.freeFn = instance.export("graphviz_free");
        this.versionFn = instance.export("graphviz_version");
        this.layoutFn = instance.export("graphviz_layout");
        this.getResultPtrFn = instance.export("graphviz_get_result_ptr");
        this.lastErrorFn = instance.export("graphviz_last_error");
    }

    /**
     * Loads and instantiates the Graphviz WebAssembly module.
     *
     * <p>
     * Internal Graphviz stdout/stderr output is silently discarded.
     *
     * @return a new {@code Graphviz} instance ready for use.
     * @throws IOException      if the WASM resource cannot be found or read.
     * @throws RuntimeException if the WASM module fails to instantiate.
     */
    public static Graphviz load() throws IOException {
        byte[] wasmBytes;
        try (InputStream is = Graphviz.class.getResourceAsStream(WASM_RESOURCE)) {
            if (is == null) {
                throw new IOException(
                        "WASM resource not found on classpath: " + WASM_RESOURCE +
                                ". Make sure the C++ build has been run first " +
                                "(cmake --build <build-dir> --target graphvizlib_java).");
            }
            wasmBytes = is.readAllBytes();
        }

        var module = Parser.parse(wasmBytes);

        // Provide WASIp1 host functions required by the standalone WASM module.
        // stdout/stderr are silently discarded to avoid polluting application logs
        // with internal Graphviz diagnostic messages.
        var wasiOpts = WasiOptions.builder()
                .withStdout(OutputStream.nullOutputStream())
                .withStderr(OutputStream.nullOutputStream())
                .build();
        var wasi = WasiPreview1.builder().withOptions(wasiOpts).build();

        var importBuilder = ImportValues.builder();
        for (var fn : wasi.toHostFunctions()) {
            importBuilder.addFunction(fn);
        }

        // Emscripten standalone-wasm still imports these two env.* functions
        // even with --standalone-wasm. Provide lightweight no-op / safe-fail
        // implementations so Endive can link the module.
        importBuilder.addFunction(new HostFunction(
                "env",
                "emscripten_notify_memory_growth",
                FunctionType.of(List.of(ValType.I32), List.of()),
                (inst, args) -> null // no-op: Java re-reads memory per call
        ));
        importBuilder.addFunction(new HostFunction(
                "env",
                "__syscall_faccessat",
                FunctionType.of(List.of(ValType.I32, ValType.I32, ValType.I32, ValType.I32), List.of(ValType.I32)),
                (inst, args) -> new long[] { -2L } // ENOENT: no filesystem in WASM
        ));

        var instance = Instance.builder(module)
                .withImportValues(importBuilder.build())
                .build();

        // Run Emscripten's standalone-wasm initialiser (C++ static constructors).
        instance.export("_initialize").apply();

        return new Graphviz(instance);
    }

    /**
     * Returns the version string of the underlying Graphviz library.
     *
     * @return version string, e.g. {@code "15.1.0"}.
     */
    public String version() {
        checkOpen();
        int bufPtr = malloc(VERSION_BUF_SIZE);
        try {
            int len = (int) versionFn.apply(bufPtr)[0];
            byte[] bytes = memory.readBytes(bufPtr, len);
            return new String(bytes, StandardCharsets.US_ASCII);
        } finally {
            free(bufPtr);
        }
    }

    /**
     * Renders a DOT-language graph to the requested output format.
     *
     * <p>
     * Only text-based formats are supported (SVG, DOT, plain, JSON, etc.).
     * Binary formats such as PNG are not supported by this Java bridge.
     *
     * @param src    DOT-language source string; must not be {@code null}.
     * @param format Output format (e.g. {@code "svg"}, {@code "dot"},
     *               {@code "plain"}, {@code "json"}).
     * @param engine Layout engine (e.g. {@code "dot"}, {@code "neato"},
     *               {@code "circo"}, {@code "fdp"}, {@code "twopi"}).
     * @return rendered output as a UTF-8 string.
     * @throws IllegalArgumentException if any argument is {@code null}.
     * @throws GraphvizException        if Graphviz reports a layout or render
     *                                  error.
     */
    public String layout(String src, String format, String engine) {
        checkOpen();
        if (src == null)
            throw new IllegalArgumentException("src must not be null");
        if (format == null)
            throw new IllegalArgumentException("format must not be null");
        if (engine == null)
            throw new IllegalArgumentException("engine must not be null");
        // Mirror JS behaviour: blank/empty input → empty output with no error.
        if (src.isEmpty())
            return "";

        byte[] srcBytes = src.getBytes(StandardCharsets.UTF_8);
        byte[] fmtBytes = format.getBytes(StandardCharsets.US_ASCII);
        byte[] engBytes = engine.getBytes(StandardCharsets.US_ASCII);

        int srcPtr = malloc(Math.max(srcBytes.length, 1));
        int fmtPtr = malloc(Math.max(fmtBytes.length, 1));
        int engPtr = malloc(Math.max(engBytes.length, 1));
        try {
            memory.write(srcPtr, srcBytes);
            memory.write(fmtPtr, fmtBytes);
            memory.write(engPtr, engBytes);

            int resultLen = (int) layoutFn.apply(
                    srcPtr, srcBytes.length,
                    fmtPtr, fmtBytes.length,
                    engPtr, engBytes.length)[0];

            if (resultLen < 0) {
                String errorMsg = readLastError();
                throw new GraphvizException(
                        "Graphviz layout failed" +
                                (errorMsg.isEmpty() ? "" : ": " + errorMsg));
            }

            int resultPtr = (int) getResultPtrFn.apply()[0];
            byte[] resultBytes = memory.readBytes(resultPtr, resultLen);
            return new String(resultBytes, StandardCharsets.UTF_8);

        } finally {
            free(srcPtr);
            free(fmtPtr);
            free(engPtr);
        }
    }

    /**
     * Releases the Endive instance. The object must not be used after this
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

    /** Write bytes into WASM linear memory, returning the allocated pointer. */
    private int writeBytes(byte[] bytes) {
        int ptr = malloc(Math.max(bytes.length, 1));
        if (bytes.length > 0)
            memory.write(ptr, bytes);
        return ptr;
    }

    /** Encode s as UTF-8 and write it into WASM memory. */
    private int writeUtf8(String s) {
        return writeBytes(s.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Read {@code len} bytes from WASM linear memory starting at
     * {@code graphviz_get_result_ptr()} and decode as UTF-8.
     * Must be called immediately after a function that stores into g_result.
     */
    private String readCurrentResult(int len) {
        if (len <= 0)
            return "";
        int ptr = (int) getResultPtrFn.apply()[0];
        return new String(memory.readBytes(ptr, len), StandardCharsets.UTF_8);
    }

    /** Convenience: look up an exported function by name. */
    private ExportFunction fn(String name) {
        return instance.export(name);
    }

    private String readLastError() {
        int errPtr = malloc(ERROR_BUF_SIZE);
        try {
            int len = (int) lastErrorFn.apply(errPtr)[0];
            if (len <= 0)
                return "";
            byte[] bytes = memory.readBytes(errPtr, Math.min(len, ERROR_BUF_SIZE));
            return new String(bytes, StandardCharsets.UTF_8).trim();
        } finally {
            free(errPtr);
        }
    }

    private void checkOpen() {
        if (closed)
            throw new IllegalStateException("Graphviz instance has been closed");
    }

    // ======================================================================
    // CGraph factory
    // ======================================================================

    /**
     * Creates a new directed graph named {@code "G"}.
     *
     * @return a new {@link CGraph}; caller must call {@link CGraph#close()} when
     *         done.
     */
    public CGraph createGraph() {
        return createGraph("G", true, false);
    }

    /**
     * Creates a new directed graph with the given name.
     *
     * @param name graph name (used in DOT serialisation); must not be {@code null}.
     * @return a new {@link CGraph}; caller must call {@link CGraph#close()} when
     *         done.
     */
    public CGraph createGraph(String name) {
        return createGraph(name, true, false);
    }

    /**
     * Creates a new graph.
     *
     * @param name     graph name; must not be {@code null}.
     * @param directed {@code true} for a directed graph ({@code digraph}),
     *                 {@code false} for an undirected graph ({@code graph}).
     * @param strict   {@code true} for a strict graph (no parallel edges).
     * @return a new {@link CGraph}; caller must call {@link CGraph#close()} when
     *         done.
     */
    public CGraph createGraph(String name, boolean directed, boolean strict) {
        checkOpen();
        byte[] nb = name.getBytes(StandardCharsets.UTF_8);
        int np = writeBytes(nb);
        try {
            int handle = (int) fn("cgraph_create").apply(
                    np, nb.length, directed ? 1 : 0, strict ? 1 : 0)[0];
            return new CGraph(handle);
        } finally {
            free(np);
        }
    }

    // ======================================================================
    // CGraph inner class
    // ======================================================================

    /**
     * A programmatically-constructed in-memory graph.
     *
     * <p>
     * Nodes, edges, attributes and subgraphs can be added incrementally.
     * Call {@link #toDot()} to serialise to DOT format, or {@link #layout}
     * to render directly without a DOT round-trip.
     *
     * <p>
     * Lifetime is tied to the parent {@link Graphviz} instance — do not
     * use a {@code CGraph} after its parent has been closed.
     *
     * <p>
     * Must be closed via {@link #close()} or try-with-resources to free
     * the underlying cgraph memory.
     */
    public final class CGraph implements AutoCloseable {

        private final int handle;
        private boolean cgClosed = false;

        private CGraph(int handle) {
            this.handle = handle;
        }

        private void checkCGOpen() {
            if (cgClosed)
                throw new IllegalStateException("CGraph has been closed");
            checkOpen();
        }

        // ------------------------------------------------------------------
        // Mutation
        // ------------------------------------------------------------------

        /** Creates (or finds) a node with the given name. */
        public void addNode(String name) {
            checkCGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                fn("cgraph_add_node").apply(handle, np, nb.length);
            } finally {
                free(np);
            }
        }

        /** Creates an edge between tail and head (no key discriminator). */
        public void addEdge(String tail, String head) {
            addEdge(tail, head, "");
        }

        /**
         * Creates an edge between tail and head with an optional key.
         * The key distinguishes parallel edges; use {@code ""} for a single edge.
         */
        public void addEdge(String tail, String head, String key) {
            checkCGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb), kp = writeBytes(kb);
            try {
                fn("cgraph_add_edge").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length);
            } finally {
                free(tp);
                free(hp);
                free(kp);
            }
        }

        /** Sets a graph-level attribute (e.g. {@code "rankdir"}, {@code "label"}). */
        public void setGraphAttr(String attr, String value) {
            checkCGOpen();
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            byte[] vb = value.getBytes(StandardCharsets.UTF_8);
            int ap = writeBytes(ab), vp = writeBytes(vb);
            try {
                fn("cgraph_set_graph_attr").apply(handle, ap, ab.length, vp, vb.length);
            } finally {
                free(ap);
                free(vp);
            }
        }

        /** Sets an attribute on a named node. */
        public void setNodeAttr(String node, String attr, String value) {
            checkCGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            byte[] vb = value.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb), ap = writeBytes(ab), vp = writeBytes(vb);
            try {
                fn("cgraph_set_node_attr").apply(
                        handle, np, nb.length, ap, ab.length, vp, vb.length);
            } finally {
                free(np);
                free(ap);
                free(vp);
            }
        }

        /** Sets an attribute on an edge identified by (tail, head, key). */
        public void setEdgeAttr(String tail, String head, String key,
                String attr, String value) {
            checkCGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            byte[] vb = value.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb), kp = writeBytes(kb),
                    ap = writeBytes(ab), vp = writeBytes(vb);
            try {
                fn("cgraph_set_edge_attr").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length,
                        ap, ab.length, vp, vb.length);
            } finally {
                free(tp);
                free(hp);
                free(kp);
                free(ap);
                free(vp);
            }
        }

        /** Removes a node (and all its edges) from the graph. */
        public void removeNode(String name) {
            checkCGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                fn("cgraph_remove_node").apply(handle, np, nb.length);
            } finally {
                free(np);
            }
        }

        /** Removes an edge (no key discriminator). */
        public void removeEdge(String tail, String head) {
            removeEdge(tail, head, "");
        }

        /** Removes an edge identified by (tail, head, key). */
        public void removeEdge(String tail, String head, String key) {
            checkCGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb), kp = writeBytes(kb);
            try {
                fn("cgraph_remove_edge").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length);
            } finally {
                free(tp);
                free(hp);
                free(kp);
            }
        }

        /**
         * Removes a subgraph boundary by name. Nodes and edges that belonged
         * to the subgraph remain in the parent graph.
         */
        public void removeSubgraph(String name) {
            checkCGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                fn("cgraph_remove_subgraph").apply(handle, np, nb.length);
            } finally {
                free(np);
            }
        }

        // ------------------------------------------------------------------
        // Queries
        // ------------------------------------------------------------------

        /** Returns {@code true} if a node with the given name exists. */
        public boolean hasNode(String name) {
            checkCGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                return fn("cgraph_has_node").apply(handle, np, nb.length)[0] != 0;
            } finally {
                free(np);
            }
        }

        /** Returns {@code true} if an edge from tail to head exists (any key). */
        public boolean hasEdge(String tail, String head) {
            return hasEdge(tail, head, "");
        }

        /** Returns {@code true} if an edge identified by (tail, head, key) exists. */
        public boolean hasEdge(String tail, String head, String key) {
            checkCGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb), kp = writeBytes(kb);
            try {
                return fn("cgraph_has_edge").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length)[0] != 0;
            } finally {
                free(tp);
                free(hp);
                free(kp);
            }
        }

        /** Returns {@code true} if a subgraph with the given name exists. */
        public boolean hasSubgraph(String name) {
            checkCGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                return fn("cgraph_has_subgraph").apply(handle, np, nb.length)[0] != 0;
            } finally {
                free(np);
            }
        }

        /** Returns the number of nodes in this graph. */
        public int nodeCount() {
            checkCGOpen();
            return (int) fn("cgraph_node_count").apply(handle)[0];
        }

        /** Returns the number of edges in this graph. */
        public int edgeCount() {
            checkCGOpen();
            return (int) fn("cgraph_edge_count").apply(handle)[0];
        }

        /** Returns the number of direct subgraphs. */
        public int subgraphCount() {
            checkCGOpen();
            return (int) fn("cgraph_subgraph_count").apply(handle)[0];
        }

        /** Returns the current value of a graph-level attribute, or {@code ""}. */
        public String getGraphAttr(String attr) {
            checkCGOpen();
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            int ap = writeBytes(ab);
            try {
                int len = (int) fn("cgraph_get_graph_attr").apply(handle, ap, ab.length)[0];
                return readCurrentResult(len);
            } finally {
                free(ap);
            }
        }

        /**
         * Returns the current value of an attribute on the named node, or {@code ""}.
         */
        public String getNodeAttr(String node, String attr) {
            checkCGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb), ap = writeBytes(ab);
            try {
                int len = (int) fn("cgraph_get_node_attr").apply(
                        handle, np, nb.length, ap, ab.length)[0];
                return readCurrentResult(len);
            } finally {
                free(np);
                free(ap);
            }
        }

        /** Returns the current value of an attribute on an edge, or {@code ""}. */
        public String getEdgeAttr(String tail, String head, String key, String attr) {
            checkCGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb),
                    kp = writeBytes(kb), ap = writeBytes(ab);
            try {
                int len = (int) fn("cgraph_get_edge_attr").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length, ap, ab.length)[0];
                return readCurrentResult(len);
            } finally {
                free(tp);
                free(hp);
                free(kp);
                free(ap);
            }
        }

        // ------------------------------------------------------------------
        // Traversal (results are JSON arrays)
        // ------------------------------------------------------------------

        /** Returns a JSON array of all node names, e.g. {@code ["a","b"]}. */
        public String nodeNames() {
            checkCGOpen();
            int len = (int) fn("cgraph_node_names").apply(handle)[0];
            return readCurrentResult(len);
        }

        /** Returns a JSON array of all direct subgraph names. */
        public String subgraphNames() {
            checkCGOpen();
            int len = (int) fn("cgraph_subgraph_names").apply(handle)[0];
            return readCurrentResult(len);
        }

        /**
         * Returns a JSON flat-triple array of all edges,
         * e.g. {@code ["tail","head","key",...]}. Each edge occupies three
         * consecutive elements.
         */
        public String edges() {
            checkCGOpen();
            int len = (int) fn("cgraph_edges").apply(handle)[0];
            return readCurrentResult(len);
        }

        /** Returns a JSON flat-triple array of out-edges for the named node. */
        public String outEdges(String node) {
            checkCGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                int len = (int) fn("cgraph_out_edges").apply(handle, np, nb.length)[0];
                return readCurrentResult(len);
            } finally {
                free(np);
            }
        }

        /** Returns a JSON flat-triple array of in-edges for the named node. */
        public String inEdges(String node) {
            checkCGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                int len = (int) fn("cgraph_in_edges").apply(handle, np, nb.length)[0];
                return readCurrentResult(len);
            } finally {
                free(np);
            }
        }

        /** Returns a JSON flat-triple array of all edges incident on the named node. */
        public String nodeEdges(String node) {
            checkCGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                int len = (int) fn("cgraph_node_edges").apply(handle, np, nb.length)[0];
                return readCurrentResult(len);
            } finally {
                free(np);
            }
        }

        // ------------------------------------------------------------------
        // Subgraph access
        // ------------------------------------------------------------------

        /**
         * Creates (or returns an existing) named subgraph.
         *
         * <p>
         * The returned {@link CSubgraph} is a lightweight view — no extra
         * C++ heap allocation is needed. Its lifetime is tied to this
         * {@code CGraph}; closing the {@code CSubgraph} is a no-op.
         */
        public CSubgraph addSubgraph(String name) {
            checkCGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                int sgHandle = (int) fn("cgraph_add_subgraph").apply(handle, np, nb.length)[0];
                return sgHandle != 0 ? new CSubgraph(sgHandle) : null;
            } finally {
                free(np);
            }
        }

        /**
         * Returns an existing subgraph by name, or {@code null} if not found.
         */
        public CSubgraph getSubgraph(String name) {
            checkCGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                int sgHandle = (int) fn("cgraph_get_subgraph").apply(handle, np, nb.length)[0];
                return sgHandle != 0 ? new CSubgraph(sgHandle) : null;
            } finally {
                free(np);
            }
        }

        // ------------------------------------------------------------------
        // Rendering
        // ------------------------------------------------------------------

        /**
         * Serialises the graph to DOT-language text without applying any layout.
         *
         * @return DOT source string.
         */
        public String toDot() {
            checkCGOpen();
            int len = (int) fn("cgraph_to_dot").apply(handle)[0];
            return readCurrentResult(len);
        }

        /**
         * Renders the in-memory graph directly without a DOT round-trip.
         *
         * @param format output format (e.g. {@code "svg"}, {@code "dot"}).
         * @param engine layout engine (e.g. {@code "dot"}, {@code "neato"}).
         * @return rendered output as a UTF-8 string.
         * @throws GraphvizException if Graphviz reports a layout or render error.
         */
        public String layout(String format, String engine) {
            checkCGOpen();
            byte[] fb = format.getBytes(StandardCharsets.UTF_8);
            byte[] eb = engine.getBytes(StandardCharsets.UTF_8);
            int fp = writeBytes(fb), ep = writeBytes(eb);
            try {
                int len = (int) fn("cgraph_layout").apply(
                        handle, fp, fb.length, ep, eb.length)[0];
                if (len < 0) {
                    String errMsg = readLastError();
                    throw new GraphvizException(
                            "Graphviz layout failed" +
                                    (errMsg.isEmpty() ? "" : ": " + errMsg));
                }
                return readCurrentResult(len);
            } finally {
                free(fp);
                free(ep);
            }
        }

        @Override
        public void close() {
            if (!cgClosed) {
                cgClosed = true;
                fn("cgraph_destroy").apply(handle);
            }
        }
    }

    // ======================================================================
    // CSubgraph inner class
    // ======================================================================

    /**
     * A non-owning view of a cgraph subgraph.
     *
     * <p>
     * Subgraph handles are backed directly by the parent {@link CGraph}'s
     * {@code Agraph_t*}; closing this object is a no-op with respect to
     * memory — all subgraph memory is freed when the parent {@code CGraph}
     * is closed.
     */
    public final class CSubgraph implements AutoCloseable {

        private final int handle;
        private boolean sgClosed = false;

        private CSubgraph(int handle) {
            this.handle = handle;
        }

        private void checkSGOpen() {
            if (sgClosed)
                throw new IllegalStateException("CSubgraph has been closed");
            checkOpen();
        }

        /** Creates (or finds) a node in this subgraph. */
        public void addNode(String name) {
            checkSGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                fn("csubgraph_add_node").apply(handle, np, nb.length);
            } finally {
                free(np);
            }
        }

        /** Creates an edge inside this subgraph (no key). */
        public void addEdge(String tail, String head) {
            addEdge(tail, head, "");
        }

        /** Creates an edge inside this subgraph with an optional key. */
        public void addEdge(String tail, String head, String key) {
            checkSGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb), kp = writeBytes(kb);
            try {
                fn("csubgraph_add_edge").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length);
            } finally {
                free(tp);
                free(hp);
                free(kp);
            }
        }

        /** Sets a subgraph-level attribute (e.g. {@code "label"}, {@code "style"}). */
        public void setAttr(String attr, String value) {
            checkSGOpen();
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            byte[] vb = value.getBytes(StandardCharsets.UTF_8);
            int ap = writeBytes(ab), vp = writeBytes(vb);
            try {
                fn("csubgraph_set_attr").apply(handle, ap, ab.length, vp, vb.length);
            } finally {
                free(ap);
                free(vp);
            }
        }

        /** Sets an attribute on a node in this subgraph. */
        public void setNodeAttr(String node, String attr, String value) {
            checkSGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            byte[] vb = value.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb), ap = writeBytes(ab), vp = writeBytes(vb);
            try {
                fn("csubgraph_set_node_attr").apply(
                        handle, np, nb.length, ap, ab.length, vp, vb.length);
            } finally {
                free(np);
                free(ap);
                free(vp);
            }
        }

        /** Sets an attribute on an edge inside this subgraph. */
        public void setEdgeAttr(String tail, String head, String key,
                String attr, String value) {
            checkSGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            byte[] vb = value.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb), kp = writeBytes(kb),
                    ap = writeBytes(ab), vp = writeBytes(vb);
            try {
                fn("csubgraph_set_edge_attr").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length,
                        ap, ab.length, vp, vb.length);
            } finally {
                free(tp);
                free(hp);
                free(kp);
                free(ap);
                free(vp);
            }
        }

        /**
         * Removes a node from this subgraph only. The node and its edges
         * remain in the root graph and other subgraphs.
         */
        public void removeNode(String name) {
            checkSGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                fn("csubgraph_remove_node").apply(handle, np, nb.length);
            } finally {
                free(np);
            }
        }

        /** Removes an edge from this subgraph only (no key). */
        public void removeEdge(String tail, String head) {
            removeEdge(tail, head, "");
        }

        /** Removes an edge from this subgraph only (with key). */
        public void removeEdge(String tail, String head, String key) {
            checkSGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb), kp = writeBytes(kb);
            try {
                fn("csubgraph_remove_edge").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length);
            } finally {
                free(tp);
                free(hp);
                free(kp);
            }
        }

        /** Returns {@code true} if the named node is in this subgraph. */
        public boolean hasNode(String name) {
            checkSGOpen();
            byte[] nb = name.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                return fn("csubgraph_has_node").apply(handle, np, nb.length)[0] != 0;
            } finally {
                free(np);
            }
        }

        /** Returns {@code true} if an edge from tail to head is in this subgraph. */
        public boolean hasEdge(String tail, String head) {
            return hasEdge(tail, head, "");
        }

        /**
         * Returns {@code true} if an edge identified by (tail, head, key) is in this
         * subgraph.
         */
        public boolean hasEdge(String tail, String head, String key) {
            checkSGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb), kp = writeBytes(kb);
            try {
                return fn("csubgraph_has_edge").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length)[0] != 0;
            } finally {
                free(tp);
                free(hp);
                free(kp);
            }
        }

        /** Returns the number of nodes in this subgraph. */
        public int nodeCount() {
            checkSGOpen();
            return (int) fn("csubgraph_node_count").apply(handle)[0];
        }

        /** Returns the number of edges in this subgraph. */
        public int edgeCount() {
            checkSGOpen();
            return (int) fn("csubgraph_edge_count").apply(handle)[0];
        }

        /** Returns the current value of a subgraph-level attribute, or {@code ""}. */
        public String getAttr(String attr) {
            checkSGOpen();
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            int ap = writeBytes(ab);
            try {
                int len = (int) fn("csubgraph_get_attr").apply(handle, ap, ab.length)[0];
                return readCurrentResult(len);
            } finally {
                free(ap);
            }
        }

        /**
         * Returns the current value of an attribute on the named node, or {@code ""}.
         */
        public String getNodeAttr(String node, String attr) {
            checkSGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb), ap = writeBytes(ab);
            try {
                int len = (int) fn("csubgraph_get_node_attr").apply(
                        handle, np, nb.length, ap, ab.length)[0];
                return readCurrentResult(len);
            } finally {
                free(np);
                free(ap);
            }
        }

        /**
         * Returns the current value of an attribute on the specified edge, or
         * {@code ""}.
         */
        public String getEdgeAttr(String tail, String head, String key, String attr) {
            checkSGOpen();
            byte[] tb = tail.getBytes(StandardCharsets.UTF_8);
            byte[] hb = head.getBytes(StandardCharsets.UTF_8);
            byte[] kb = key.getBytes(StandardCharsets.UTF_8);
            byte[] ab = attr.getBytes(StandardCharsets.UTF_8);
            int tp = writeBytes(tb), hp = writeBytes(hb),
                    kp = writeBytes(kb), ap = writeBytes(ab);
            try {
                int len = (int) fn("csubgraph_get_edge_attr").apply(
                        handle, tp, tb.length, hp, hb.length, kp, kb.length, ap, ab.length)[0];
                return readCurrentResult(len);
            } finally {
                free(tp);
                free(hp);
                free(kp);
                free(ap);
            }
        }

        /** Returns a JSON array of node names in this subgraph. */
        public String nodeNames() {
            checkSGOpen();
            int len = (int) fn("csubgraph_node_names").apply(handle)[0];
            return readCurrentResult(len);
        }

        /** Returns a JSON flat-triple array of all edges in this subgraph. */
        public String edges() {
            checkSGOpen();
            int len = (int) fn("csubgraph_edges").apply(handle)[0];
            return readCurrentResult(len);
        }

        /** Returns a JSON flat-triple array of out-edges for the named node. */
        public String outEdges(String node) {
            checkSGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                int len = (int) fn("csubgraph_out_edges").apply(handle, np, nb.length)[0];
                return readCurrentResult(len);
            } finally {
                free(np);
            }
        }

        /** Returns a JSON flat-triple array of in-edges for the named node. */
        public String inEdges(String node) {
            checkSGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                int len = (int) fn("csubgraph_in_edges").apply(handle, np, nb.length)[0];
                return readCurrentResult(len);
            } finally {
                free(np);
            }
        }

        /** Returns a JSON flat-triple array of all edges incident on the named node. */
        public String nodeEdges(String node) {
            checkSGOpen();
            byte[] nb = node.getBytes(StandardCharsets.UTF_8);
            int np = writeBytes(nb);
            try {
                int len = (int) fn("csubgraph_node_edges").apply(handle, np, nb.length)[0];
                return readCurrentResult(len);
            } finally {
                free(np);
            }
        }

        /** No-op: subgraph lifetime is tied to the parent {@link CGraph}. */
        @Override
        public void close() {
            sgClosed = true;
        }
    }
}
