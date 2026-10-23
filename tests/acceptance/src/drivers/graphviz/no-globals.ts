import { Worker } from "node:worker_threads";
import { LIBRARY_CAPABILITIES, type Capability, type GraphvizDriver, type OperationName, type Operations, type Outcome } from "./driver.ts";

type Pending = (outcome: Outcome<unknown>) => void;

/**
 * Talks to the package inside a Node worker thread from which the optional browser
 * globals (navigator, window, fetch, …) have been removed.
 */
export async function createNoGlobalsDriver(): Promise<GraphvizDriver> {
    const worker = new Worker(new URL("./no-globals-worker.mjs", import.meta.url));
    const pending = new Map<number, Pending>();
    let nextId = 0;

    await new Promise<void>((resolve, reject) => {
        const onMessage = (msg: { ready?: boolean; globalsStillPresent?: string[] }) => {
            if (!msg.ready) return;
            worker.off("message", onMessage);
            if (msg.globalsStillPresent?.length) {
                reject(new Error(`node-no-globals driver could not remove: ${msg.globalsStillPresent.join(", ")}`));
            } else {
                resolve();
            }
        };
        worker.on("message", onMessage);
        worker.once("error", reject);
    });

    worker.on("message", ({ id, outcome }: { id?: number; outcome?: Outcome<unknown> }) => {
        if (id === undefined || !outcome) return;
        pending.get(id)?.(outcome);
        pending.delete(id);
    });
    worker.on("error", (err: Error) => {
        for (const settle of pending.values()) settle({ ok: false, error: `worker error: ${err.message}` });
        pending.clear();
    });

    return {
        name: "node-no-globals",
        capabilities: new Set<Capability>(LIBRARY_CAPABILITIES),
        execute<K extends OperationName>(op: K, args: Operations[K]["args"]): Promise<Outcome<Operations[K]["result"]>> {
            const id = nextId++;
            return new Promise(resolve => {
                pending.set(id, resolve as Pending);
                worker.postMessage({ id, op, args });
            });
        },
        async dispose() {
            await worker.terminate();
        }
    };
}
