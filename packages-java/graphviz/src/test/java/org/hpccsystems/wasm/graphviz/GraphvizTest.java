package org.hpccsystems.wasm.graphviz;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link Graphviz}.
 *
 * <p>
 * The tests mirror the behaviour validated by the TypeScript test suite so
 * that parity between language bindings can be confirmed.
 */
class GraphvizTest {

    private Graphviz graphviz;

    @BeforeEach
    void setUp() throws Exception {
        graphviz = Graphviz.load();
    }

    @AfterEach
    void tearDown() {
        if (graphviz != null) {
            graphviz.close();
        }
    }

    @Test
    void version_returnsNonBlankString() {
        String v = graphviz.version();
        assertNotNull(v);
        assertFalse(v.isBlank(), "version string should not be blank");
        assertEquals("15.1.0", v, "version should match the bundled library version"); // Update when upgrading Graphviz
    }

    @Test
    void layout_simpleDigraph_returnsSvg() {
        String svg = graphviz.layout("digraph { Hello -> World }", "svg", "dot");
        assertNotNull(svg);
        assertFalse(svg.isBlank(), "SVG output should not be blank");
        assertTrue(svg.contains("<svg"), "output should contain an <svg> element");
    }

    @Test
    void layout_dotFormat_returnsDot() {
        String dot = graphviz.layout("digraph { a -> b }", "dot", "dot");
        assertNotNull(dot);
        assertTrue(dot.contains("digraph") || dot.contains("->"),
                "dot output should contain graph syntax");
    }

    @Test
    void layout_plainFormat_returnsPlain() {
        String plain = graphviz.layout("digraph { a -> b }", "plain", "dot");
        assertNotNull(plain);
        assertTrue(plain.startsWith("graph "), "plain output should start with 'graph '");
    }

    @Test
    void layout_emptyInput_returnsEmptyString() {
        // mirrors the JS "blank-dot" test: graphviz.dot("", "svg") === ""
        String result = graphviz.layout("", "svg", "dot");
        assertNotNull(result);
        assertTrue(result.isEmpty(), "empty DOT input should produce empty output");
    }

    @Test
    void layout_neatoEngine_producesSvg() {
        String svg = graphviz.layout("graph { a -- b -- c }", "svg", "neato");
        assertNotNull(svg);
        assertTrue(svg.contains("<svg"), "neato layout should produce SVG");
    }

    @Test
    void layout_circoEngine_producesSvg() {
        String svg = graphviz.layout("graph { a -- b -- c }", "svg", "circo");
        assertNotNull(svg);
        assertTrue(svg.contains("<svg"), "circo layout should produce SVG");
    }

    @Test
    void layout_fdpEngine_producesSvg() {
        String svg = graphviz.layout("graph { a -- b -- c }", "svg", "fdp");
        assertNotNull(svg);
        assertTrue(svg.contains("<svg"), "fdp layout should produce SVG");
    }

    @Test
    void layout_sfdpEngine_producesSvg() {
        String svg = graphviz.layout("graph { a -- b -- c }", "svg", "sfdp");
        assertNotNull(svg);
        assertTrue(svg.contains("<svg"), "sfdp layout should produce SVG");
    }

    @Test
    void layout_osageEngine_producesSvg() {
        String svg = graphviz.layout("graph { a -- b -- c }", "svg", "osage");
        assertNotNull(svg);
        assertTrue(svg.contains("<svg"), "osage layout should produce SVG");
    }

    @Test
    void layout_patchworkEngine_producesSvg() {
        String svg = graphviz.layout("graph { a -- b -- c }", "svg", "patchwork");
        assertNotNull(svg);
        assertTrue(svg.contains("<svg"), "patchwork layout should produce SVG");
    }

    @Test
    void layout_twopiEngine_producesSvg() {
        String svg = graphviz.layout("graph { a -- b -- c }", "svg", "twopi");
        assertNotNull(svg);
        assertTrue(svg.contains("<svg"), "twopi layout should produce SVG");
    }

    @Test
    void layout_nullSrc_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> graphviz.layout(null, "svg", "dot"));
    }

    @Test
    void layout_nullFormat_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> graphviz.layout("digraph{}", null, "dot"));
    }

    @Test
    void layout_nullEngine_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class,
                () -> graphviz.layout("digraph{}", "svg", null));
    }

    @Test
    void layout_invalidDot_throwsGraphvizException() {
        // mirrors JS "bad dot / syntax error" test: error message should contain
        // "syntax error in line"
        GraphvizException ex = assertThrows(GraphvizException.class,
                () -> graphviz.layout("this is not valid dot", "svg", "dot"));
        assertTrue(ex.getMessage().contains("syntax error in line"),
                "exception message should contain 'syntax error in line', was: " + ex.getMessage());
    }

    @Test
    void layout_recoversAfterInvalidDot() {
        // mirrors JS test: valid layout still works after a failed one
        assertThrows(GraphvizException.class,
                () -> graphviz.layout("this is not valid dot", "svg", "dot"));
        String svg = graphviz.layout("digraph { Hello -> World }", "svg", "dot");
        assertNotNull(svg);
        assertTrue(svg.contains("<svg"), "should recover and produce SVG after an error");
        // a second bad-dot should also throw cleanly
        assertThrows(GraphvizException.class,
                () -> graphviz.layout("this is not valid dot", "svg", "dot"));
    }

    @Test
    void layout_selfLoopGraph_doesNotFail() {
        // Regression for GH-389: repeated layout of a graph with a self-loop must not
        // crash
        String selfLoopDot = "digraph {\n" +
                "  ie1 [label=\"Customers switching\"];\n" +
                "  and1 [label=\"Change Me\"];\n" +
                "  ie1 -> and1; and1 -> ie1;\n" +
                "}";
        for (int i = 0; i < 6; i++) {
            String result = graphviz.layout(selfLoopDot, "json", "dot");
            assertNotNull(result);
            assertFalse(result.isBlank(), "layout " + i + " should return non-blank JSON");
        }
    }

    @Test
    void closedInstance_throwsOnUse() {
        graphviz.close();
        assertThrows(IllegalStateException.class,
                () -> graphviz.layout("digraph{}", "svg", "dot"));
    }

    @Test
    void load_canBeCalledMultipleTimes_returnsIndependentInstances() throws Exception {
        try (Graphviz second = Graphviz.load()) {
            String svg1 = graphviz.layout("digraph { a -> b }", "svg", "dot");
            String svg2 = second.layout("digraph { a -> b }", "svg", "dot");
            assertNotNull(svg1);
            assertNotNull(svg2);
        }
    }

    // ------------------------------------------------------------------
    // CGraph / CSubgraph tests
    // ------------------------------------------------------------------

    @Test
    void cgraph_toDot_producesValidDot() {
        try (Graphviz.CGraph g = graphviz.createGraph("G")) {
            g.addNode("A");
            g.addNode("B");
            g.addEdge("A", "B");
            String dot = g.toDot();
            assertNotNull(dot);
            assertFalse(dot.isBlank());
            assertTrue(dot.contains("A"), "toDot should contain node A");
            assertTrue(dot.contains("B"), "toDot should contain node B");
        }
    }

    @Test
    void cgraph_layout_producesSvg() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addEdge("Hello", "World");
            String svg = g.layout("svg", "dot");
            assertNotNull(svg);
            assertTrue(svg.contains("<svg"), "layout should produce SVG");
        }
    }

    @Test
    void cgraph_nodeCounts_correct() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            assertEquals(0, g.nodeCount());
            assertEquals(0, g.edgeCount());
            g.addNode("X");
            g.addNode("Y");
            g.addEdge("X", "Y");
            assertEquals(2, g.nodeCount());
            assertEquals(1, g.edgeCount());
        }
    }

    @Test
    void cgraph_hasNode_hasEdge() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addEdge("A", "B");
            assertTrue(g.hasNode("A"));
            assertTrue(g.hasNode("B"));
            assertFalse(g.hasNode("C"));
            assertTrue(g.hasEdge("A", "B"));
            assertFalse(g.hasEdge("B", "A"));
        }
    }

    @Test
    void cgraph_setAndGetGraphAttr() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.setGraphAttr("rankdir", "LR");
            assertEquals("LR", g.getGraphAttr("rankdir"));
        }
    }

    @Test
    void cgraph_setAndGetNodeAttr() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addNode("X");
            g.setNodeAttr("X", "color", "red");
            assertEquals("red", g.getNodeAttr("X", "color"));
        }
    }

    @Test
    void cgraph_setAndGetEdgeAttr() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addEdge("A", "B");
            g.setEdgeAttr("A", "B", "", "label", "hello");
            assertEquals("hello", g.getEdgeAttr("A", "B", "", "label"));
        }
    }

    @Test
    void cgraph_nodeNames_returnsJsonArray() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addNode("alpha");
            g.addNode("beta");
            String names = g.nodeNames();
            assertTrue(names.startsWith("["), "should be a JSON array");
            assertTrue(names.contains("\"alpha\""));
            assertTrue(names.contains("\"beta\""));
        }
    }

    @Test
    void cgraph_edges_returnsJsonFlatTriples() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addEdge("src", "dst");
            String edges = g.edges();
            assertTrue(edges.startsWith("["));
            assertTrue(edges.contains("\"src\""));
            assertTrue(edges.contains("\"dst\""));
        }
    }

    @Test
    void cgraph_removeNode_removesItAndEdges() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addEdge("A", "B");
            g.addEdge("A", "C");
            assertTrue(g.hasNode("A"));
            g.removeNode("A");
            assertFalse(g.hasNode("A"));
            assertEquals(0, g.edgeCount());
        }
    }

    @Test
    void cgraph_removeEdge_keepsNodes() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addEdge("A", "B");
            g.removeEdge("A", "B");
            assertFalse(g.hasEdge("A", "B"));
            assertTrue(g.hasNode("A"));
            assertTrue(g.hasNode("B"));
        }
    }

    @Test
    void cgraph_undirectedGraph_worksCorrectly() {
        try (Graphviz.CGraph g = graphviz.createGraph("U", false, false)) {
            g.addEdge("X", "Y");
            String dot = g.toDot();
            assertTrue(dot.contains("graph ") || dot.contains("--"),
                    "undirected graph DOT should use graph keyword or '--'");
        }
    }

    @Test
    void cgraph_subgraph_createAndQuery() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addNode("A");
            g.addNode("B");
            g.addNode("C");

            Graphviz.CSubgraph sg = g.addSubgraph("cluster_0");
            assertNotNull(sg);
            sg.addNode("A");
            sg.addNode("B");

            assertTrue(g.hasSubgraph("cluster_0"));
            assertEquals(1, g.subgraphCount());

            assertTrue(sg.hasNode("A"));
            assertTrue(sg.hasNode("B"));
            assertFalse(sg.hasNode("C"), "C was not added to subgraph");
            assertEquals(2, sg.nodeCount());

            sg.close();
        }
    }

    @Test
    void cgraph_subgraph_setAttrAndLayout() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addEdge("A", "B");
            Graphviz.CSubgraph sg = g.addSubgraph("cluster_1");
            sg.addNode("A");
            sg.setAttr("label", "Group");
            assertEquals("Group", sg.getAttr("label"));

            // The whole graph (including subgraph) should still render
            String svg = g.layout("svg", "dot");
            assertTrue(svg.contains("<svg"));

            sg.close();
        }
    }

    @Test
    void cgraph_subgraphNames_returnsJsonArray() {
        try (Graphviz.CGraph g = graphviz.createGraph()) {
            g.addSubgraph("cluster_a").close();
            g.addSubgraph("cluster_b").close();
            String names = g.subgraphNames();
            assertTrue(names.startsWith("["));
            assertTrue(names.contains("\"cluster_a\""));
            assertTrue(names.contains("\"cluster_b\""));
        }
    }

    @Test
    void cgraph_closedInstance_throwsOnUse() {
        Graphviz.CGraph g = graphviz.createGraph();
        g.close();
        assertThrows(IllegalStateException.class, g::nodeCount);
    }
}
