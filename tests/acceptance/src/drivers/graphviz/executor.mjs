// Executes driver operations against a loaded `Graphviz` class.
// Plain JS (no TypeScript) so it can be shared verbatim by the in-process drivers and by the
// `node-no-globals` worker, which runs outside Vitest's transform pipeline.
// Request/response shapes are defined in ./driver.ts (`Operations`).

const PROBE_DOT = "digraph { a -> b }";

function summarise(graph) {
    try {
        return {
            nodeNames: graph.nodeNames(),
            edgeCount: graph.edgeCount(),
            subgraphCount: graph.subgraphCount(),
            dot: graph.toDot(),
            svg: graph.layout("svg", "dot")
        };
    } finally {
        graph.delete();
    }
}

function rendersOk(graphviz) {
    try {
        return graphviz.layout(PROBE_DOT, "svg").includes("<svg");
    } catch {
        return false;
    }
}

// Loads to compare identity, then releases the probe's own reference so it does not skew counts.
async function probeIs(Graphviz, expected) {
    const probe = await Graphviz.load();
    probe.dispose();
    return probe === expected;
}

function throwsAfterDisposal(callback) {
    try {
        callback();
        return false;
    } catch {
        return true;
    }
}

const operations = {
    async version(Graphviz) {
        return (await Graphviz.load()).version();
    },

    async layout(Graphviz, { dot, format, engine, images, yInvert, nop }) {
        const graphviz = await Graphviz.load();
        const options = {};
        if (images) options.images = images;
        if (yInvert) options.yInvert = true;
        if (nop) options.nop = nop;
        return graphviz.layout(dot, format ?? "svg", engine ?? "dot", options);
    },

    async buildGraph(Graphviz, { id, nodes, edges, clusters }) {
        const graphviz = await Graphviz.load();
        const graph = graphviz.createGraph(id ?? "G");
        for (const node of nodes) graph.addNode(node);
        for (const [tail, head] of edges) graph.addEdge(tail, head);
        for (const cluster of clusters ?? []) {
            const sg = graph.addSubgraph(cluster.id);
            for (const node of cluster.nodes) sg.addNode(node);
            sg.delete();
        }
        return summarise(graph);
    },

    async readGraph(Graphviz, { dot }) {
        const graphviz = await Graphviz.load();
        return summarise(graphviz.read(dot));
    },

    async acyclic(Graphviz, { dot, doWrite }) {
        return (await Graphviz.load()).acyclic(dot, doWrite);
    },

    async tred(Graphviz, { dot }) {
        return (await Graphviz.load()).tred(dot);
    },

    async unflatten(Graphviz, { dot, maxMinlen }) {
        return (await Graphviz.load()).unflatten(dot, maxMinlen);
    },

    async loadTwice(Graphviz) {
        const first = await Graphviz.load();
        const second = await Graphviz.load();
        return { sameInstance: first === second, rendersAfterwards: rendersOk(second), notes: {} };
    },

    async unloadTwiceThenLoad(Graphviz) {
        const before = await Graphviz.load();
        let secondDisposeSilent = true;
        let legacyUnloadSilent = true;
        Graphviz.dispose();
        try {
            Graphviz.dispose();
        } catch {
            secondDisposeSilent = false;
        }
        try {
            Graphviz.unload();
        } catch {
            legacyUnloadSilent = false;
        }
        const after = await Graphviz.load();
        return {
            sameInstance: before === after,
            rendersAfterwards: rendersOk(after),
            notes: { secondDisposeSilent, legacyUnloadSilent, stableAfterReload: await probeIs(Graphviz, after) }
        };
    },

    async disposeThenLoad(Graphviz) {
        Graphviz.dispose();
        const before = await Graphviz.load();
        const supportsUsing = typeof Symbol.dispose === "symbol" && typeof before[Symbol.dispose] === "function";
        if (supportsUsing) {
            before[Symbol.dispose]();
        } else {
            before.dispose();
        }
        const after = await Graphviz.load();
        let staleDisposeIsNoop = true;
        try {
            before.dispose();
        } catch {
            staleDisposeIsNoop = false;
        }
        staleDisposeIsNoop = staleDisposeIsNoop && await probeIs(Graphviz, after);
        return {
            sameInstance: before === after,
            rendersAfterwards: rendersOk(after),
            notes: { supportsUsing, staleDisposeIsNoop }
        };
    },

    async overlappingUsingScopes(Graphviz) {
        Graphviz.dispose();
        const outer = await Graphviz.load();
        const inner = await Graphviz.load();
        const supportsUsing = typeof Symbol.dispose === "symbol" && typeof inner[Symbol.dispose] === "function";
        if (supportsUsing) {
            inner[Symbol.dispose]();
        } else {
            inner.dispose();
        }
        const remainingScopeUsable = rendersOk(outer) && await probeIs(Graphviz, outer);

        if (supportsUsing) {
            outer[Symbol.dispose]();
        } else {
            outer.dispose();
        }
        const reloaded = await Graphviz.load();
        return {
            sameInstance: outer === inner,
            rendersAfterwards: rendersOk(reloaded),
            notes: { supportsUsing, remainingScopeUsable, reloadAfterScopesUsable: rendersOk(reloaded) }
        };
    },

    async resourceDisposal(Graphviz) {
        Graphviz.dispose();
        const symbolDispose = Symbol.dispose;
        const supportsSymbolDispose = typeof symbolDispose === "symbol";
        const graphviz = await Graphviz.load();
        const report = {
            graphviz: {
                dispose: typeof graphviz.dispose === "function",
                symbolDispose: supportsSymbolDispose && typeof graphviz[symbolDispose] === "function",
                disposeWorks: false,
                usingWorks: false
            },
            graph: { dispose: false, symbolDispose: false, disposeWorks: false, usingWorks: false },
            subgraph: { dispose: false, symbolDispose: false, disposeWorks: false, usingWorks: false }
        };

        if (report.graphviz.dispose) {
            graphviz.dispose();
            report.graphviz.disposeWorks = !(await probeIs(Graphviz, graphviz));
        }
        if (supportsSymbolDispose) {
            const scopedGraphviz = await Graphviz.load();
            scopedGraphviz[symbolDispose]();
            report.graphviz.usingWorks = !(await probeIs(Graphviz, scopedGraphviz));
        }

        const graphvizForGraph = await Graphviz.load();
        const explicitGraph = graphvizForGraph.createGraph("explicit");
        report.graph.dispose = typeof explicitGraph.dispose === "function";
        report.graph.symbolDispose = supportsSymbolDispose && typeof explicitGraph[symbolDispose] === "function";
        if (report.graph.dispose) {
            explicitGraph.dispose();
            report.graph.disposeWorks = throwsAfterDisposal(() => explicitGraph.toDot());
        } else if (report.graph.symbolDispose) {
            explicitGraph[symbolDispose]();
        }

        if (supportsSymbolDispose) {
            const scopedGraph = graphvizForGraph.createGraph("scoped");
            scopedGraph.addNode("a");
            scopedGraph[symbolDispose]();
            report.graph.usingWorks = throwsAfterDisposal(() => scopedGraph.toDot());
        }

        const graphvizForSubgraph = await Graphviz.load();
        const explicitParent = graphvizForSubgraph.createGraph("explicit-parent");
        const explicitSubgraph = explicitParent.addSubgraph("explicit");
        report.subgraph.dispose = typeof explicitSubgraph.dispose === "function";
        report.subgraph.symbolDispose = supportsSymbolDispose && typeof explicitSubgraph[symbolDispose] === "function";
        if (report.subgraph.dispose) {
            explicitSubgraph.dispose();
            report.subgraph.disposeWorks = throwsAfterDisposal(() => explicitSubgraph.nodeCount());
        } else if (report.subgraph.symbolDispose) {
            explicitSubgraph[symbolDispose]();
        }
        explicitParent.delete();

        if (supportsSymbolDispose) {
            const parent = graphvizForSubgraph.createGraph("scoped-parent");
            try {
                const scopedSubgraph = parent.addSubgraph("scoped");
                scopedSubgraph.addNode("a");
                scopedSubgraph[symbolDispose]();
                report.subgraph.usingWorks = throwsAfterDisposal(() => scopedSubgraph.nodeCount())
                    && parent.nodeCount() === 1;
            } finally {
                parent.delete();
            }
        }

        return report;
    }
};

export async function execute(Graphviz, op, args) {
    const fn = operations[op];
    if (!fn) {
        return { ok: false, error: `Unsupported operation: ${op}` };
    }
    try {
        return { ok: true, value: await fn(Graphviz, args ?? {}) };
    } catch (e) {
        return { ok: false, error: String(e?.message ?? e) };
    }
}
