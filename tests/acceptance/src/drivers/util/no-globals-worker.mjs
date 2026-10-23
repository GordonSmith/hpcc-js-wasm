import { parentPort } from "node:worker_threads";

const OPTIONAL_BROWSER_GLOBALS = ["navigator", "window", "document", "Worker", "XMLHttpRequest", "fetch", "Blob", "SharedArrayBuffer"];
for (const name of OPTIONAL_BROWSER_GLOBALS) {
    delete globalThis[name];
}
const globalsStillPresent = OPTIONAL_BROWSER_GLOBALS.filter(name => typeof globalThis[name] !== "undefined");
const utility = await import("@hpcc-js/wasm-util");
const { execute } = await import("./executor.mjs");

parentPort.on("message", async ({ id, op, args }) => {
    parentPort.postMessage({ id, outcome: await execute(utility, op, args) });
});

parentPort.postMessage({ ready: true, globalsStillPresent });
