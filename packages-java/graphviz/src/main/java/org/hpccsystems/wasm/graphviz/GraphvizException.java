package org.hpccsystems.wasm.graphviz;

/**
 * Thrown when Graphviz fails to parse or lay out the supplied DOT source.
 */
public final class GraphvizException extends RuntimeException {

    public GraphvizException(String message) {
        super(message);
    }

    public GraphvizException(String message, Throwable cause) {
        super(message, cause);
    }
}
