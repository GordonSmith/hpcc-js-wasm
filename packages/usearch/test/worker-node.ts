import { parentPort } from "node:worker_threads";
import { USearchWasm } from "@hpcc-js/wasm-usearch";

parentPort?.on("message", async function () {
    let usearchWasm = await USearchWasm.load();
    const index = usearchWasm.create(3);
    const v1 = new usearchWasm.VectorF32();
    v1.push_back(0.2);
    v1.push_back(0.6);
    v1.push_back(0.4);
    index.add(42n, v1);

});

