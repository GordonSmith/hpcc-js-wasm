import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCliDriver, type CliRun, type GraphvizCliDriver } from "../drivers/graphviz/cli.ts";
import type { SpecId } from "./scenario.ts";

export class CliResult {
    constructor(private readonly result: CliRun) { }

    shouldExitSuccessfully(): this {
        expect(this.result.exitCode, this.result.stderr).toBe(0);
        return this;
    }

    shouldExitWithFailure(): this {
        expect(this.result.exitCode, "exit code").not.toBe(0);
        expect(this.result.exitCode, "exit code").not.toBeNull();
        return this;
    }

    shouldPrint(text: string | RegExp): this {
        if (typeof text === "string") expect(this.result.stdout).toContain(text);
        else expect(this.result.stdout).toMatch(text);
        return this;
    }

    shouldPrintUsage(): this {
        expect(this.result.stdout).toMatch(/^Usage:/);
        return this;
    }

    shouldPrintSvgWithNodes(...ids: string[]): this {
        expect(this.result.stdout).toContain("<svg");
        for (const id of ids) expect(this.result.stdout).toContain(`<title>${id}</title>`);
        return this;
    }

    shouldInvertYComparedTo(reference: CliResult, firstNode: string, secondNode: string): this {
        const first = this.positionOf(firstNode);
        const second = this.positionOf(secondNode);
        const referenceFirst = reference.positionOf(firstNode);
        const referenceSecond = reference.positionOf(secondNode);

        expect(first.x).toBe(referenceFirst.x);
        expect(second.x).toBe(referenceSecond.x);
        expect((first.y - second.y) * (referenceFirst.y - referenceSecond.y)).toBeLessThan(0);
        return this;
    }

    private positionOf(id: string): { x: number; y: number } {
        const line = this.result.stdout.split("\n").find(l => l.startsWith(`node ${id} `));
        expect(line, `node ${id} in plain output`).toBeDefined();
        const [, , x, y] = line!.split(" ");
        return { x: Number(x), y: Number(y) };
    }

    /** GVCLI-ERR-001: error message plus usage on stderr, nothing on stdout. */
    shouldReportError(message: string | RegExp): this {
        const errorLine = this.result.stderr.split("\n").find(l => l.startsWith("Error:")) ?? "";
        if (typeof message === "string") expect(errorLine).toContain(message);
        else expect(errorLine).toMatch(message);
        expect(this.result.stderr).toContain("Usage:");
        expect(this.result.stdout).toBe("");
        return this;
    }
}

/** Domain language for behaviour that only the command line has. */
export class GraphvizCliDsl {
    constructor(private readonly driver: GraphvizCliDriver) { }

    async invoke(...args: string[]): Promise<CliResult> {
        return new CliResult(await this.driver.run(args));
    }

    async invokeWithFile(file: { name: string; contents: string }, ...args: string[]): Promise<CliResult> {
        return new CliResult(await this.driver.run(args, { files: { [file.name]: file.contents } }));
    }
}

export interface CliScenarios {
    scenario(specId: SpecId, title: string, body: (cli: GraphvizCliDsl) => Promise<void>): void;
}

export function forGraphvizCli(suite: string, define: (s: CliScenarios) => void): void {
    describe(`${suite} [cli]`, () => {
        let driver: GraphvizCliDriver | undefined;
        beforeAll(async () => {
            driver = await createCliDriver();
        });
        afterAll(async () => {
            await driver?.dispose();
        });
        define({
            scenario(specId, title, body) {
                it(`${specId}: ${title}`, async () => {
                    await body(new GraphvizCliDsl(driver!));
                });
            }
        });
    });
}
