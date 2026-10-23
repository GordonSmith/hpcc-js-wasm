import { forEachGraphvizDriver } from "../src/dsl/scenario.ts";
import { graphs } from "../src/dsl/graphviz.ts";

// specs/graphviz/graph-model.md

forEachGraphvizDriver("graphviz graph model and tools", ({ scenario }) => {

    scenario("GV-GRAPH-001", "a graph can be built from nodes, edges and clusters", ["graphModel"], async gv => {
        (await gv.buildGraph({ nodes: ["a", "b", "c"], edges: [["a", "b"], ["b", "c"]], clusters: [{ id: "grp", nodes: ["c"] }] }))
            .shouldHaveNodes("a", "b", "c")
            .shouldHaveEdgeCount(2)
            .shouldHaveClusterCount(1)
            .dotShouldMentionEdges(["a", "b"], ["b", "c"]);
    });

    scenario("GV-GRAPH-002", "a built graph can be rendered", ["graphModel"], async gv => {
        (await gv.buildGraph({ nodes: ["a", "b"], edges: [["a", "b"]] }))
            .renderedSvgShouldContainNodes("a", "b");
    });

    scenario("GV-GRAPH-003", "DOT can be read into a graph model", ["graphModel"], async gv => {
        (await gv.readGraph(graphs.chain))
            .shouldHaveNodes("x", "y", "z")
            .shouldHaveEdgeCount(2);
    });

    scenario("GV-TOOLS-001", "acyclic detects and breaks cycles", ["tools"], async gv => {
        (await gv.acyclic(graphs.cyclic)).shouldReportCyclic(2).shouldOutputNothing();
        (await gv.acyclic(graphs.cyclic, { output: true })).shouldReportCyclic(2).shouldOutputDot();
        (await gv.acyclic(graphs.transitive)).shouldReportNotCyclic();
    });

    scenario("GV-TOOLS-002", "tred computes the transitive reduction", ["tools"], async gv => {
        (await gv.tred(graphs.transitive)).shouldHaveExactlyEdges(["a", "b"], ["b", "c"]);
    });

    scenario("GV-TOOLS-003", "unflatten staggers fan-out edges", ["tools"], async gv => {
        (await gv.unflatten(graphs.fanOut, 2)).shouldAssignMinlen({ "a->b": 1, "a->c": 2, "a->d": 1, "a->e": 2 });
    });
});
