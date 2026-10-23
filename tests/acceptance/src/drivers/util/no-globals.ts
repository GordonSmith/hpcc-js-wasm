import { Worker } from "node:worker_threads";
import type { Capability, UtilDriver, OperationName, Operations, Outcome } from "./driver.ts";

type Pending = (outcome: Outcome<unknown>) => void;

export async function createNoGlobalsDriver(): Promise<UtilDriver> {
    const worker = new Worker(new URL("./no-globals-worker.mjs", import.meta.url));
    const pending = new Map<number, Pending>();
    let nextId = 0;

    await new Promise<void>((resolve, reject) => {
        const onMessage = (message: { ready?: boolean; globalsStillPresent?: string[] }) => {
            if (!message.ready) return;
            worker.off("message", onMessage);
            if (message.globalsStillPresent?.length) {
                reject(new Error(`node-no-globals driver could not remove: ${message.globalsStillPresent.join(", ")}`));
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
    worker.on("error", (error: Error) => {
        for (const settle of pending.values()) settle({ ok: false, error: `worker error: ${error.message}` });
        pending.clear();
    });

    return {
        name: "node-no-globals",
        capabilities: new Set<Capability>(["heap", "strings", "filesystem", "noOptionalGlobals"]),
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
