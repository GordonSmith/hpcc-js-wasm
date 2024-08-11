import { parentPort } from "node:worker_threads";
import { Graphviz } from "@hpcc-js/wasm-graphviz";

parentPort?.on("message", async function (data) {
    let graphviz = await Graphviz.load();
    let v = graphviz.version();
    Graphviz.unload();
    parentPort?.postMessage(data + v);
    process.exit(0);
});

