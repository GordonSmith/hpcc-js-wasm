import { forGraphvizCli } from "../src/dsl/graphviz-cli.ts";
import { graphs } from "../src/dsl/graphviz.ts";

// specs/graphviz-cli/cli.md

forGraphvizCli("graphviz-cli", ({ scenario }) => {

    scenario("GVCLI-ARGS-001", "--help prints usage", async cli => {
        (await cli.invoke("--help")).shouldExitSuccessfully().shouldPrintUsage();
        (await cli.invoke("-h")).shouldExitSuccessfully().shouldPrintUsage();
    });

    scenario("GVCLI-ARGS-002", "-v prints the Graphviz version", async cli => {
        (await cli.invoke("-v")).shouldExitSuccessfully().shouldPrint(/^GraphViz version:\s+\d+\.\d+\.\d+/);
    });

    scenario("GVCLI-ARGS-003", "layout engine and output format are selectable", async cli => {
        (await cli.invoke(graphs.twoNodes)).shouldExitSuccessfully().shouldPrintSvgWithNodes("a", "b");
        (await cli.invoke("-K", "neato", "-T", "plain", graphs.twoNodes)).shouldExitSuccessfully().shouldPrint(/^graph .*\nnode a /);
        (await cli.invoke("--layout", "circo", "--format=dot", graphs.twoNodes)).shouldExitSuccessfully().shouldPrint(/^digraph\b/);
    });

    scenario("GVCLI-ARGS-004", "neato no-op mode requires the neato layout", async cli => {
        (await cli.invoke("-K", "neato", "-n", "2", "-T", "plain", graphs.pinned))
            .shouldExitSuccessfully()
            .shouldPrint(/^graph /)
            .shouldPrint(/^node a /m);
        (await cli.invoke("--layout=neato", "--neato-no-op=2", "--format=plain", graphs.pinned))
            .shouldExitSuccessfully()
            .shouldPrint(/^graph /)
            .shouldPrint(/^node b /m);
        (await cli.invoke("-K", "dot", "-n", "2", graphs.twoNodes))
            .shouldReportError("-n option is only supported with -K neato");
        (await cli.invoke("--layout=dot", "--neato-no-op=2", graphs.twoNodes))
            .shouldReportError("-n option is only supported with -K neato");
    });

    scenario("GVCLI-ARGS-005", "Y inversion applies to plain output", async cli => {
        const plain = await cli.invoke("-K", "neato", "-T", "plain", graphs.pinned);
        plain.shouldExitSuccessfully().shouldPrint(/^graph /).shouldPrint(/^node a /m).shouldPrint(/^node b /m);

        (await cli.invoke("-K", "neato", "-T", "plain", "-y", graphs.pinned))
            .shouldExitSuccessfully()
            .shouldInvertYComparedTo(plain, "a", "b");
        (await cli.invoke("--layout=neato", "--format=plain", "--invert-y", graphs.pinned))
            .shouldExitSuccessfully()
            .shouldInvertYComparedTo(plain, "a", "b");
        (await cli.invoke("-y", graphs.twoNodes))
            .shouldExitSuccessfully()
            .shouldPrintSvgWithNodes("a", "b");
    });

    scenario("GVCLI-INPUT-001", "the positional argument is a file path or inline DOT", async cli => {
        (await cli.invokeWithFile({ name: "graph.dot", contents: "digraph { fromFile -> b }" }, "graph.dot"))
            .shouldExitSuccessfully()
            .shouldPrintSvgWithNodes("fromFile", "b");
        (await cli.invoke("digraph { inline -> b }"))
            .shouldExitSuccessfully()
            .shouldPrintSvgWithNodes("inline", "b");
    });

    scenario("GVCLI-ERR-001", "errors are reported on stderr with usage", async cli => {
        (await cli.invoke()).shouldReportError("'fileOrDot' is required");
        (await cli.invoke("digraph{a}", "digraph{b}")).shouldReportError("Only one 'fileOrDot' argument is allowed");
        (await cli.invoke("-n", "1", graphs.twoNodes)).shouldReportError("-n option is only supported with -K neato");
        (await cli.invoke("-K")).shouldReportError("-K option requires a value");
        (await cli.invoke(graphs.invalid)).shouldReportError(/syntax error in line 1/);
    });

    scenario("GVCLI-ERR-002", "errors set a non-zero exit code", async cli => {
        (await cli.invoke()).shouldExitWithFailure();
        (await cli.invoke(graphs.invalid)).shouldExitWithFailure();
        (await cli.invoke("-K")).shouldExitWithFailure();
        (await cli.invoke(graphs.twoNodes)).shouldExitSuccessfully();
    });
});
