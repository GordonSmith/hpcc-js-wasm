// Worker entry for the `node-no-globals` driver.
// Removes optional browser globals *before* the package is imported, then serves
// `{ id, op, args }` requests using the shared executor.
import { parentPort } from "node:worker_threads";

const OPTIONAL_BROWSER_GLOBALS = ["navigator", "window", "document", "Worker", "XMLHttpRequest", "fetch", "Blob", "SharedArrayBuffer"];
for (const name of OPTIONAL_BROWSER_GLOBALS) {
    delete globalThis[name];
}
const missing = OPTIONAL_BROWSER_GLOBALS.filter(name => typeof globalThis[name] !== "undefined");

const { Graphviz } = await import("@hpcc-js/wasm-graphviz");
const { execute } = await import("./executor.mjs");

parentPort.on("message", async ({ id, op, args }) => {
    parentPort.postMessage({ id, outcome: await execute(Graphviz, op, args) });
});

parentPort.postMessage({ ready: true, globalsStillPresent: missing });
