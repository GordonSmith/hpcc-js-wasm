import { expect } from "chai";
import { Worker } from "node:worker_threads";
import { Graphviz } from "@hpcc-js/wasm-graphviz";

describe("worker-node", function () {
    it("worker-esm", async function () {
        let graphviz = await Graphviz.load();
        let v = graphviz.version();
        Graphviz.unload();

        const data = new Uint8Array(Array.from({ length: 1000 }, (_, i) => i % 256));

        const value = await new Promise(resolve => {
            const myWorker = new Worker("./dist-test/worker.node.js");
            myWorker.postMessage(data);
            myWorker.on("message", function (data) {
                resolve(data);
            });
        });
        expect(value).to.deep.equal(data + v);
    });
});
