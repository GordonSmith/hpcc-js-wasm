import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Capability, GraphvizDriver, LayoutRequest, OperationName, Operations, Outcome } from "./driver.ts";

export interface CliRun {
    exitCode: number | null;
    stdout: string;
    stderr: string;
}

export interface CliRunOptions {
    /** files to create in the working directory before running, name -> contents */
    files?: Record<string, string>;
}

export interface GraphvizCliDriver extends GraphvizDriver {
    /** Raw access to the command line, used by CLI-only specs. */
    run(args: string[], options?: CliRunOptions): Promise<CliRun>;
}

const CLI_CAPABILITIES: Capability[] = ["layout", "version", "yInvert", "nop"];

function cliBinPath(): string {
    // Resolution only; importing the bin would execute it.
    return createRequire(import.meta.url).resolve("@hpcc-js/wasm-graphviz-cli");
}

function layoutArgs(req: LayoutRequest): string[] {
    const args = ["-K", req.engine ?? "dot", "-T", req.format ?? "svg"];
    if (req.yInvert) args.push("-y");
    if (req.nop) args.push("-n", String(req.nop));
    args.push("--", req.dot);
    return args;
}

function stripConsoleNewline(text: string): string {
    return text.endsWith("\n") ? text.slice(0, -1) : text;
}

/** Translate a process run into an Outcome: anything reported on stderr as `Error:` is a failure. */
function toOutcome(run: CliRun): Outcome<string> {
    const errorLine = run.stderr.split("\n").find(line => line.startsWith("Error:"));
    if (errorLine !== undefined || (run.exitCode ?? 1) !== 0) {
        return { ok: false, error: (errorLine ?? run.stderr).replace(/^Error:\s*/, "").trim() || `exit code ${run.exitCode}` };
    }
    return { ok: true, value: stripConsoleNewline(run.stdout) };
}

/**
 * Talks to the package via the `wasm-graphviz-cli` executable in a child Node process.
 */
export async function createCliDriver(): Promise<GraphvizCliDriver> {
    const bin = cliBinPath();

    async function run(args: string[], options: CliRunOptions = {}): Promise<CliRun> {
        const cwd = await mkdtemp(join(tmpdir(), "gv-cli-"));
        try {
            for (const [name, contents] of Object.entries(options.files ?? {})) {
                await writeFile(join(cwd, name), contents, "utf8");
            }
            return await new Promise<CliRun>((resolve, reject) => {
                const child = spawn(process.execPath, [bin, ...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
                let stdout = "";
                let stderr = "";
                child.stdout.setEncoding("utf8").on("data", chunk => stdout += chunk);
                child.stderr.setEncoding("utf8").on("data", chunk => stderr += chunk);
                child.once("error", reject);
                child.once("close", exitCode => resolve({ exitCode, stdout, stderr }));
            });
        } finally {
            await rm(cwd, { recursive: true, force: true });
        }
    }

    async function execute<K extends OperationName>(op: K, args: Operations[K]["args"]): Promise<Outcome<Operations[K]["result"]>> {
        switch (op) {
            case "layout":
                return toOutcome(await run(layoutArgs(args as LayoutRequest))) as Outcome<Operations[K]["result"]>;
            case "version": {
                const outcome = toOutcome(await run(["-v"]));
                if (!outcome.ok) return outcome;
                const match = /GraphViz version:\s*(\S+)/.exec(outcome.value);
                return (match ? { ok: true, value: match[1] } : { ok: false, error: `unrecognised version output: ${outcome.value}` }) as Outcome<Operations[K]["result"]>;
            }
            default:
                return { ok: false, error: `cli driver does not support ${op}` };
        }
    }

    return {
        name: "cli",
        capabilities: new Set(CLI_CAPABILITIES),
        execute,
        run,
        async dispose() { }
    };
}
