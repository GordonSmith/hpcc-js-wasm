import { expect } from "vitest";
import type { GraphModelSpec, GraphSummary, GraphvizDriver, ImageSpec, LifecycleReport, Outcome, ResourceDisposalReport } from "../drivers/graphviz/index.ts";

/** Named sample graphs so test cases read as intent, not as DOT. */
export const graphs = {
    twoNodes: "digraph { a -> b }",
    /** a is pinned below-left of b */
    pinned: "digraph { a [pos=\"0,0!\"]; b [pos=\"100,100!\"]; a -> b }",
    invalid: "digraph { a -> }",
    empty: "",
    transitive: "digraph { a -> b; b -> c; a -> c }",
    cyclic: "digraph { a -> b; b -> c; c -> a; c -> d; d -> b }",
    chain: "digraph { x -> y -> z }",
    fanOut: "digraph { a -> b; a -> c; a -> d; a -> e }",
    withImage: (path: string) => `digraph { a [image="${path}"]; }`
} as const;

export const ENGINES = ["circo", "dot", "fdp", "sfdp", "neato", "osage", "patchwork", "twopi"] as const;
export type EngineName = typeof ENGINES[number];

export const FORMATS = ["svg", "dot", "xdot", "canon", "json", "dot_json", "xdot_json", "plain", "plain-ext"] as const;
export type FormatName = typeof FORMATS[number];

export interface RenderOptions {
    engine?: EngineName;
    format?: FormatName;
    images?: ImageSpec[];
    yInvert?: boolean;
    nop?: number;
}

function expectOk<T>(outcome: Outcome<T>, what: string): T {
    if (!outcome.ok) {
        expect.fail(`${what} failed: ${outcome.error}`);
    }
    return outcome.value;
}

// --- Results ----------------------------------------------------------------

export class RenderResult {
    constructor(private readonly outcome: Outcome<string>) { }

    get text(): string {
        return expectOk(this.outcome, "render");
    }

    shouldSucceed(): this {
        this.text;
        return this;
    }

    shouldFailWith(message: string | RegExp): this {
        expect(this.outcome.ok, "expected render to fail").toBe(false);
        if (!this.outcome.ok) {
            if (typeof message === "string") expect(this.outcome.error).toContain(message);
            else expect(this.outcome.error).toMatch(message);
        }
        return this;
    }

    shouldBeEmpty(): this {
        expect(this.text).toBe("");
        return this;
    }

    shouldBeSvg(): this {
        expect(this.text).toContain("<svg");
        return this;
    }

    /** SVG output: every node has its own `<title>` element. */
    shouldContainNodes(...ids: string[]): this {
        for (const id of ids) {
            expect(this.text).toContain(`<title>${id}</title>`);
        }
        return this;
    }

    /** Checks the output has the shape required by GV-RENDER-003. */
    shouldBeA(format: FormatName): this {
        const text = this.text;
        switch (format) {
            case "svg":
                expect(text).toContain("<svg");
                break;
            case "dot":
            case "xdot":
            case "canon":
                expect(text.trimStart()).toMatch(/^digraph\b/);
                break;
            case "json":
            case "dot_json":
            case "xdot_json": {
                const json = JSON.parse(text);
                expect(json).toHaveProperty("name");
                expect(json.directed).toBe(true);
                break;
            }
            case "plain":
            case "plain-ext": {
                const lines = text.trim().split("\n");
                expect(lines[0]).toMatch(/^graph /);
                expect(lines.slice(1, -1).every(l => /^(node|edge) /.test(l))).toBe(true);
                expect(lines.at(-1)).toBe("stop");
                break;
            }
        }
        return this;
    }

    /** Position of a node in `plain` output. */
    positionOf(id: string): { x: number; y: number } {
        const line = this.text.split("\n").find(l => l.startsWith(`node ${id} `));
        expect(line, `node ${id} in plain output`).toBeDefined();
        const [, , x, y] = line!.split(" ");
        return { x: Number(x), y: Number(y) };
    }

    shouldContainImage(path: string, size: { width: string; height: string }): this {
        const image = new RegExp(`<image[^>]*xlink:href="${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`).exec(this.text);
        expect(image, `<image> for ${path}`).not.toBeNull();
        expect(image![0]).toContain(`width="${size.width}"`);
        expect(image![0]).toContain(`height="${size.height}"`);
        return this;
    }
}

export class GraphResult {
    constructor(private readonly summary: GraphSummary) { }

    shouldHaveNodes(...ids: string[]): this {
        expect([...this.summary.nodeNames].sort()).toEqual([...ids].sort());
        return this;
    }

    shouldHaveEdgeCount(count: number): this {
        expect(this.summary.edgeCount).toBe(count);
        return this;
    }

    shouldHaveClusterCount(count: number): this {
        expect(this.summary.subgraphCount).toBe(count);
        return this;
    }

    dotShouldMentionEdges(...edges: [string, string][]): this {
        for (const [tail, head] of edges) {
            expect(this.summary.dot).toMatch(new RegExp(`\\b${tail}\\s*->\\s*${head}\\b`));
        }
        return this;
    }

    renderedSvgShouldContainNodes(...ids: string[]): this {
        new RenderResult({ ok: true, value: this.summary.svg }).shouldBeSvg().shouldContainNodes(...ids);
        return this;
    }
}

export class LifecycleResult {
    constructor(private readonly report: LifecycleReport) { }

    shouldReturnSameInstance(): this {
        expect(this.report.sameInstance).toBe(true);
        return this;
    }

    shouldReturnNewInstance(): this {
        expect(this.report.sameInstance).toBe(false);
        return this;
    }

    shouldStillRender(): this {
        expect(this.report.rendersAfterwards).toBe(true);
        return this;
    }

    shouldObserve(note: string): this {
        expect(this.report.notes[note], note).toBe(true);
        return this;
    }
}

export class ResourceDisposalResult {
    constructor(private readonly report: ResourceDisposalReport) { }

    shouldExposeDisposeForEveryResource(): this {
        for (const [resource, result] of Object.entries(this.report)) {
            expect(result.dispose, `${resource}.dispose()`).toBe(true);
        }
        return this;
    }

    shouldSupportUsingForEveryResource(): this {
        for (const [resource, result] of Object.entries(this.report)) {
            expect(result.symbolDispose, `${resource}[Symbol.dispose]`).toBe(true);
            expect(result.usingWorks, `${resource} using scope`).toBe(true);
        }
        return this;
    }

    shouldDisposeExplicitlyForEveryResource(): this {
        for (const [resource, result] of Object.entries(this.report)) {
            expect(result.disposeWorks, `${resource} explicit disposal`).toBe(true);
        }
        return this;
    }
}

function edgesOf(dot: string): string[] {
    return [...dot.matchAll(/(\w+)\s*->\s*(\w+)/g)].map(m => `${m[1]}->${m[2]}`).sort();
}

// --- DSL --------------------------------------------------------------------

/**
 * The graphviz domain language used by test cases. Knows nothing about how the
 * system under test is reached; that is the driver's job.
 */
export class GraphvizDsl {
    constructor(private readonly driver: GraphvizDriver) { }

    async version(): Promise<string> {
        return expectOk(await this.driver.execute("version", {}), "version");
    }

    async render(dot: string, options: RenderOptions = {}): Promise<RenderResult> {
        return new RenderResult(await this.driver.execute("layout", { dot, ...options }));
    }

    async buildGraph(model: GraphModelSpec): Promise<GraphResult> {
        return new GraphResult(expectOk(await this.driver.execute("buildGraph", model), "buildGraph"));
    }

    async readGraph(dot: string): Promise<GraphResult> {
        return new GraphResult(expectOk(await this.driver.execute("readGraph", { dot }), "readGraph"));
    }

    async acyclic(dot: string, options: { output?: boolean } = {}) {
        const result = expectOk(await this.driver.execute("acyclic", { dot, doWrite: !!options.output }), "acyclic");
        return {
            shouldReportCyclic(reversedEdges: number) {
                expect(result.acyclic).toBe(true);
                expect(result.num_rev).toBe(reversedEdges);
                return this;
            },
            shouldReportNotCyclic() {
                expect(result.acyclic).toBe(false);
                expect(result.num_rev).toBe(0);
                return this;
            },
            shouldOutputDot() {
                expect(result.outFile.trimStart()).toMatch(/^digraph\b/);
                return this;
            },
            shouldOutputNothing() {
                expect(result.outFile).toBe("");
                return this;
            }
        };
    }

    async tred(dot: string) {
        const result = expectOk(await this.driver.execute("tred", { dot }), "tred");
        return {
            shouldHaveExactlyEdges(...edges: [string, string][]) {
                expect(edgesOf(result.out)).toEqual(edges.map(([t, h]) => `${t}->${h}`).sort());
                return this;
            }
        };
    }

    async unflatten(dot: string, maxMinlen: number) {
        const out = expectOk(await this.driver.execute("unflatten", { dot, maxMinlen }), "unflatten");
        return {
            shouldAssignMinlen(expected: Record<string, number>) {
                for (const [edge, minlen] of Object.entries(expected)) {
                    const [tail, head] = edge.split("->").map(s => s.trim());
                    expect(out).toMatch(new RegExp(`\\b${tail}\\s*->\\s*${head}\\s*\\[minlen=${minlen}\\]`));
                }
                return this;
            }
        };
    }

    async loadTwice(): Promise<LifecycleResult> {
        return new LifecycleResult(expectOk(await this.driver.execute("loadTwice", {}), "loadTwice"));
    }

    async unloadTwiceThenLoad(): Promise<LifecycleResult> {
        return new LifecycleResult(expectOk(await this.driver.execute("unloadTwiceThenLoad", {}), "unloadTwiceThenLoad"));
    }

    async disposeThenLoad(): Promise<LifecycleResult> {
        return new LifecycleResult(expectOk(await this.driver.execute("disposeThenLoad", {}), "disposeThenLoad"));
    }

    async overlappingUsingScopes(): Promise<LifecycleResult> {
        return new LifecycleResult(expectOk(await this.driver.execute("overlappingUsingScopes", {}), "overlappingUsingScopes"));
    }

    async disposeEveryResource(): Promise<ResourceDisposalResult> {
        return new ResourceDisposalResult(expectOk(await this.driver.execute("resourceDisposal", {}), "resourceDisposal"));
    }
}
