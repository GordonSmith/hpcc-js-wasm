/**
 * Protocol-driver contract for `@hpcc-js/wasm-graphviz`.
 *
 * Everything that crosses this boundary is plain, structured-cloneable data so that the
 * same request can be served in-process, over a worker message channel or via a CLI
 * process. Drivers translate requests; they never decide whether behaviour is correct.
 */

export type DriverName = "node-inprocess" | "node-no-globals" | "browser" | "cli";

export type Capability =
    | "layout"        // render DOT with a chosen engine/format
    | "version"       // report the Graphviz version
    | "emptyInput"    // can submit an empty DOT string
    | "images"        // `images` option
    | "yInvert"       // `yInvert` option
    | "nop"           // `nop` option
    | "lifecycle"     // load / unload / dispose of the library instance
    | "graphModel"    // createGraph / read
    | "tools";        // acyclic / tred / unflatten

export const LIBRARY_CAPABILITIES: readonly Capability[] = [
    "layout", "version", "emptyInput", "images", "yInvert", "nop", "lifecycle", "graphModel", "tools"
];

export interface ImageSpec {
    path: string;
    width: string;
    height: string;
}

export interface LayoutRequest {
    dot: string;
    format?: string;
    engine?: string;
    images?: ImageSpec[];
    yInvert?: boolean;
    nop?: number;
}

export interface GraphModelSpec {
    id?: string;
    nodes: string[];
    edges: [tail: string, head: string][];
    clusters?: { id: string; nodes: string[] }[];
}

export interface GraphSummary {
    nodeNames: string[];
    edgeCount: number;
    subgraphCount: number;
    dot: string;
    svg: string;
}

export interface LifecycleReport {
    /** true when the second load returned the very same instance as the first */
    sameInstance: boolean;
    /** true when the instance obtained after the operation can still render */
    rendersAfterwards: boolean;
    /** operation-specific extra observations */
    notes: Record<string, boolean>;
}

export interface ResourceDisposalReport {
    graphviz: { dispose: boolean; symbolDispose: boolean; disposeWorks: boolean; usingWorks: boolean };
    graph: { dispose: boolean; symbolDispose: boolean; disposeWorks: boolean; usingWorks: boolean };
    subgraph: { dispose: boolean; symbolDispose: boolean; disposeWorks: boolean; usingWorks: boolean };
}

export interface Operations {
    version: { args: Record<string, never>; result: string };
    layout: { args: LayoutRequest; result: string };
    buildGraph: { args: GraphModelSpec; result: GraphSummary };
    readGraph: { args: { dot: string }; result: GraphSummary };
    acyclic: { args: { dot: string; doWrite: boolean }; result: { acyclic: boolean; num_rev: number; outFile: string } };
    tred: { args: { dot: string }; result: { out: string; err: string } };
    unflatten: { args: { dot: string; maxMinlen: number }; result: string };
    loadTwice: { args: Record<string, never>; result: LifecycleReport };
    unloadTwiceThenLoad: { args: Record<string, never>; result: LifecycleReport };
    disposeThenLoad: { args: Record<string, never>; result: LifecycleReport };
    overlappingUsingScopes: { args: Record<string, never>; result: LifecycleReport };
    resourceDisposal: { args: Record<string, never>; result: ResourceDisposalReport };
}

export type OperationName = keyof Operations;

export type Outcome<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };

export interface GraphvizDriver {
    readonly name: DriverName;
    readonly capabilities: ReadonlySet<Capability>;
    execute<K extends OperationName>(op: K, args: Operations[K]["args"]): Promise<Outcome<Operations[K]["result"]>>;
    dispose(): Promise<void>;
}

export interface DriverDescriptor {
    readonly name: DriverName;
    readonly environment: "node" | "browser";
    readonly capabilities: readonly Capability[];
    create(): Promise<GraphvizDriver>;
}
